const express = require("express");
const axios = require("axios");
const router = express.Router();
const colors = require("colors");
const EmqxAlert = require("../models/EmqxAlert.js");

const EMQX_API_RULES = process.env.EMQX_API_RULES;

const auth = {
    auth: {
        username: process.env.EMQX_USER,
        password: process.env.EMQX_PASS
    }
};

// CRUD alarms

router.post("/create", async (req, res) => {
    try {
        let alert = req.body.alert;
        alert.userId = req.userInfo.id;
        let rule = await createAlarmRule(alert);
        if (rule) {
            res.status(200).send({ "message": "success", "alarmRule": rule });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "failure", "error": error });
    }
})

router.put("/updateAlertRule/:deviceID", async (req, res) => {
    try {
        let userID = req.userInfo.id;
        let deviceID = req.params.deviceID;
        let alertRule = req.body.alertRule;
        if (userID === alertRule.userId && deviceID === alertRule.deviceId) {
            let rule = await updateAlertRuleStatus(alertRule.emqxRuleId, alertRule.status);
            res.status(200).send({ "message": "success", "ruleUpdated": rule });
        }
        else {
            res.status(200).send({ "message": "failure", "error": "Incorrect userId or deviceId." });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "failure", "error": error });
    }
});

router.delete("/delete/:deviceID/:emqxRuleId", async (req, res) => {
    try {
      let emqxRuleId = req.params.emqxRuleId;
      await deleteAlertRule(emqxRuleId);
      res.status(200).send({ "message": "success", "alertDeleted": emqxRuleId });
    } catch (error) {
      console.log(error);
      res.status(500).json({ "message": "failure", "error": error });
    }
  });

// CRUD emqx rules

async function updateAlertRuleStatus(emqxRuleId, status) {
    try {
        let url = EMQX_API_RULES + "/" + emqxRuleId;
        let newRule = {
            enabled: status
        }
        const res = await axios.put(url, newRule, auth); // update on emqx
        if (res.status === 200 && res.data.data) { // get the rule id and update on mongo too
            await EmqxAlert.updateOne({ "emqxRuleId": res.data.data.id }, { status });
            console.log("Alert rule updated: ".green + JSON.stringify(res.data.data));
            return res.data.data;
        }
        else {
            throw new Error("Error updating alarm rule. " + JSON.stringify(res.data));
        }
    } catch (error) {
        console.log("updateAlertRuleStatus error: ".red, error);
    }
}

async function createAlarmRule(alert) {
    try {
        let url = EMQX_API_RULES;
        const topic = alert.userId + "/" + alert.deviceId + "/" + alert.variable + "/sdata";
        const sql = "SELECT username, topic, payload FROM \"" + topic +
            "\" WHERE payload.value " + alert.condition + " " + alert.value + " AND is_not_null(payload.value)";
        var rule = {
            rawsql: sql,
            actions: [
                {
                    name: "data_to_webserver",
                    params: {
                        $resource: process.env.EMQX_RESOURCE_ALARM_WEBHOOK_ID, //global.resourceAlarm.id
                        payload_tmpl: '{"userId":"' + alert.userId + '", "payload": ${payload}, "topic": "${topic}"}'
                    }
                }
            ],
            description: "alarm-rule",
            enabled: alert.status
        };
        const res = await axios.post(url, rule, auth); // save on emqx
        if (res.status === 200 && res.data.data) { // get the rule id and save on mongo too
            let ruleMongo = await EmqxAlert.create({
                "userId": alert.userId,
                "deviceId": alert.deviceId,
                "emqxRuleId": res.data.data.id,
                "status": alert.status,
                "name": alert.name,
                "description": alert.description,
                "status": alert.status,
                "variable": alert.variable,
                "value": alert.value,
                "condition": alert.condition,
                "triggerTimeInterval": alert.triggerTimeInterval,
            })

            url = url + "/" + ruleMongo.emqxRuleId;
            let payload_templ = '{"userId":"' + alert.userId + '", "deviceId":"' + alert.deviceId + '", "payload":${payload}, "topic":"${topic}", "emqxRuleId":"' + ruleMongo.emqxRuleId + '", "value":' + alert.value + ', "condition":"' + alert.condition + '", "variable":"' + alert.variable + '", "triggerTimeInterval":' + alert.triggerTimeInterval + '}';
            rule.actions[0].params.payload_tmpl = payload_templ;
            let updateRule = await axios.put(url, rule, auth);

            console.log("Rule saved for alarm: ".green + JSON.stringify(updateRule.data.data));
            return updateRule.data.data;
        }
        else {
            throw new Error("Error saving new rule for alarm. " + JSON.stringify(res.data));
        }
    } catch (error) {
        console.log("createAlarmRule error: ".red + error);
        return {};
    }
}

async function deleteAlertRule(emqxRuleId) {
    try {
      let url = EMQX_API_RULES + "/" + emqxRuleId;
      let emqxRule = await axios.delete(url, auth);
      let mongoRule = await EmqxAlert.deleteOne({ emqxRuleId });
      return [emqxRule, mongoRule];
    } catch (error) {
      console.log("deleteAlertRule error: ".red, error);
    }
  }


module.exports = router;
