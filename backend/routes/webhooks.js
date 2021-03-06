const express = require("express");
const router = express.Router();
const colors = require("colors");
var mqtt = require("mqtt");
const { v4: uuidv4 } = require('uuid');

const DeviceData = require("../models/DeviceData.js");
const Device = require("../models/Device.js");
const Notification = require("../models/Notification.js");

const EMQX_RESOURCE_TOKEN = process.env.EMQX_RESOURCE_TOKEN; // token sent by emqx Resource qhen calling webhook.
var mqttClient; // mqtt client to send notifications to frontend.

function beginMqtt() {
  let options = {
    port: 1883,
    host: process.env.EMQX_HOST,
    clientId: "backend/" + uuidv4(),
    username: process.env.EMQX_SUPERUSER, // can send and subscribe to any topic
    password: process.env.EMQX_SUPERUSER,
    keepalive: 60,
    reconnectPeriod: 5000,
    protocolId: "MQIsdp",
    protocolVersion: 3,
    clean: true,
    encoding: "utf8",
  };
  mqttClient = mqtt.connect(`mqtt://${process.env.EMQX_HOST}`, options);
  mqttClient.on("connect", function () {
    console.log(">>> MQTT client connected successfully.".green);
  });
  mqttClient.on("reconnect", function () {
    console.log(">>> MQTT client REconnected successfully.".green);
  });
  mqttClient.on("error", function () {
    console.log(">>> MQTT client connection failed.".red);
  });
};

function sendMqttNotification(notification) {
  let topic = notification.userId + "/notifications";
  let message = JSON.stringify(notification);
  console.log("Publish notification:".magenta, topic, message);
  mqttClient.publish(topic, message);
};

router.post("/saver", async (req, res) => { // webhook called when data.payload.save equals 1, defined on emqx rule.
  try {
    console.log("Webhook saver:".magenta);
    console.log("Token from emqx resource:".magenta, req.headers.token); // this token is defined on http://localhost:18083/#/resources > view
    if (req.headers.token !== EMQX_RESOURCE_TOKEN) {
      throw new Error("Invalid emqx token.")
    };
    let data = req.body;
    // check if device sending data really exists and then save data on mongo.
    let deviceId = data.topic.split("/")[1]; // userId/deviceId/variable/sdata
    let variable = data.topic.split("/")[2];
    let device = await Device.findOne({ _id: deviceId, user: data.userId });
    if (device) {
      let logSaved = await DeviceData.create({
        "userId": data.userId,
        "deviceId": deviceId,
        "variable": variable,
        "value": data.payload.value,
        "time": Date.now(),
      });
      console.log("Saved device data:".yellow, JSON.stringify(logSaved));
    };
    res.status(200).send({ "message": "success" });
  } catch (error) {
    console.log("/saver error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.post("/alarm", async (req, res) => { // webhook called by emqx alarm resource.
  try {
    console.log("Webhook alarm:".magenta);
    console.log("Token from emqx resource:".magenta, req.headers.token); // this token is defined on http://localhost:18083/#/resources > view
    if (req.headers.token !== EMQX_RESOURCE_TOKEN) {
      throw new Error("Invalid emqx token.")
    };
    let alertReceived = req.body;
    // check time passed between notifications
    let lastNotification = await Notification.findOne({ deviceId: alertReceived.deviceId, emqxRuleId: alertReceived.emqxRuleId }).sort({ createdAt: -1 });
    if (!lastNotification) {
      console.log("New notification.".magenta);
      Notification.create(alertReceived);
      sendMqttNotification(alertReceived);
    }
    else { // check triggerTimeInterval (minutes)
      let timeBetweenNotifications = (new Date().getTime() - new Date(lastNotification.createdAt).getTime())/1000/60; // minutes
      if (timeBetweenNotifications > alertReceived.triggerTimeInterval) {
        console.log("Repeat notification.".magenta);
        Notification.create(alertReceived);
        sendMqttNotification(alertReceived);
      }
    }
    res.status(200).send({ "message": "success", "notification": alertReceived });
  } catch (error) {
    console.log("/alarm error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

setTimeout(() => { beginMqtt() }, 3000);

module.exports = router;
