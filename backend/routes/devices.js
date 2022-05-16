const express = require("express");
const axios = require("axios");
const router = express.Router();
const colors = require("colors");
const Device = require("../models/Device.js");
const Dashboard = require("../models/Dashboard.js");
const EmqxSaver = require("../models/EmqxSaver.js");
const EmqxAlert = require("../models/EmqxAlert.js");

const EMQX_API_RULES = process.env.EMQX_API_RULES;

const auth = {
  auth: {
    username: process.env.EMQX_USER,
    password: process.env.EMQX_PASS
  }
};

// CRUD devices

router.get("/all", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let devices = await Device.find({ userID }).populate('user', ["id", "name", "email"]);
    devices = JSON.parse(JSON.stringify(devices));
    // get saver rules
    let saverRules = await getSaverRules(userID);
    let dashs = await getDashboards(userID);
    // get alarm rules
    let alarmsRules = await getAlarmRules(userID);
    devices.forEach((device, index) => {
      // add the saver rule of each device
      devices[index].saverRule = saverRules.filter(saverRule => saverRule.deviceId === device._id)[0];
      // add the dashboards of each device
      devices[index].dashboards = [];
      dashs.forEach(dash => {
        dash.widgets.forEach(widget => {
          //console.log(widget.device.toString())
          if (widget.device.toString() === device._id) {
            devices[index].dashboards.push(dash);
          }
        })
      })
      // add the alarms of each device
      devices[index].alerts = alarmsRules.filter(alarmRule => alarmRule.deviceId === device._id)
    });
    res.status(200).send({ "message": "success", "devices": devices });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.get("/:deviceID", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let _id = req.params.deviceID;
    let device = await Device.findOne({ userID, _id }).populate('user', ["id", "name", "email"]);
    // TODO: get saver rule for this device
    res.status(200).send({ "message": "success", "device": device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.post("/create", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let body = req.body;
    let device = await Device.create({
      user: userID,
      name: body.name,
      description: body.description,
      variables: body.variables,
    });
    // create rule on emqx broker and mongo
    let rule = await createSaverRule(userID, device._id, false);
    res.status(200).send({ "message": "success", "deviceCreated": device, "ruleCreated": rule });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.delete("/delete/:deviceID/:emqxRuleId", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let deviceId = req.params.deviceID;
    let emqxRuleId = req.params.emqxRuleId;
    let device = await Device.deleteOne({ userID, deviceId });
    // also delete rule from emqx
    await deleteSaverRule(emqxRuleId);
    res.status(200).send({ "message": "success", "deviceDeleted": device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.put("/update/:deviceID", async (req, res) => { // not being used
  try {
    let userID = req.userInfo.id;
    let _id = req.params.deviceID;
    let body = req.body;
    let device = await Device.findOneAndUpdate({ userID, _id }, { ...body });
    res.status(200).send({ "message": "success", "deviceUpdated": device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

// CRUD emqx rules

router.put("/updateSaverRule/:deviceID", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let deviceID = req.params.deviceID;
    let saverRule = req.body.saverRule;
    if (userID === saverRule.userId && deviceID === saverRule.deviceId) {
      let rule = await updateSaverRuleStatus(saverRule.emqxRuleId, saverRule.status);
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

async function createSaverRule(userId, deviceId, status = false) {
  try {
    let url = EMQX_API_RULES;
    const topic =  userId + "/" + deviceId + "/+/sdata"; // + means any variable from device.
    const sql = "SELECT topic, payload FROM \"" + topic + "\" WHERE payload.save = 1";
    var rule = {
      rawsql: sql,
      actions: [
        {
          name: "data_to_webserver",
          params: {
            $resource: process.env.EMQX_RESOURCE_SAVER_WEBHOOK_ID, //global.resourceSaver.id
            payload_tmpl: '{"userId":"' +  userId + '", "payload": ${payload}, "topic": "${topic}"}'
          }
        }
      ],
      description: "saver-rule",
      enabled: status
    };
    const res = await axios.post(url, rule, auth); // save on emqx
    if (res.status === 200 && res.data.data) { // get the rule id and save on mongo too
      await EmqxSaver.create({
        "userId": userId,
        "deviceId": deviceId,
        "emqxRuleId": res.data.data.id,
        "status": status
      })
      console.log("Rule saved for saver: ".green + JSON.stringify(res.data.data));
      return res.data.data;
    }
    else {
      throw new Error("Error saving new rule for saver. " + JSON.stringify(res.data));
    }
  } catch (error) {
    console.log("createSaverRule error: ".red + error);
    return {};
  }
}

async function getSaverRules(userId) {
  try {
    let rules = await EmqxSaver.find({ userId });
    return rules;
  } catch (error) {
    console.log("getSaverRules error: ".red, error);
  }
}

async function updateSaverRuleStatus(emqxRuleId, status) {
  try {
    let url = EMQX_API_RULES + "/" + emqxRuleId;
    let newRule = {
      enabled: status
    }
    const res = await axios.put(url, newRule, auth); // update on emqx
    if (res.status === 200 && res.data.data) { // get the rule id and update on mongo too
      await EmqxSaver.updateOne({ "emqxRuleId": res.data.data.id }, { status });
      console.log("Saver rule updated: ".green + JSON.stringify(res.data.data));
      return res.data.data;
    }
    else {
      throw new Error("Error updating saver rule. " + JSON.stringify(res.data));
    }
  } catch (error) {
    console.log("updateSaverRuleStatus error: ".red, error);
  }
}

async function deleteSaverRule(emqxRuleId) {
  try {
    let url = EMQX_API_RULES + "/" + emqxRuleId;
    let emqxRule = await axios.delete(url, auth);
    let mongoRule = await EmqxSaver.deleteOne({ emqxRuleId });
    return [emqxRule, mongoRule];
  } catch (error) {
    console.log("deleteSaverRules error: ".red, error);
  }
}

async function getDashboards(userId) {
  try {
    let dashs = await Dashboard.find({ userId });
    return dashs;
  } catch (error) {
    console.log("getDashboards error: ".red, error);
  }
}

async function getAlarmRules(userId) {
  try {
    let rules = await EmqxAlert.find({ userId });
    return rules;
  } catch (error) {
    console.log("getAlarmRules error: ".red, error);
  }
}

module.exports = router;
