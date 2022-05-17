const express = require("express");
const router = express.Router();
const colors = require("colors");
var mqtt = require("mqtt");
const { v4: uuidv4 } = require('uuid');

const DeviceData = require("../models/DeviceData.js");
const Device = require("../models/Device.js");
const Notification = require("../models/Notification.js");

var client; // mqtt client to send notifications to frontend.

function beginMqtt() {
  let options = {
    port: 1883,
    host: "localhost",
    clientId: "webhook_superuser-iot-backend-" + uuidv4(),
    username: process.env.EMQX_SUPERUSER, // can send and subscribe to any topic
    password: process.env.EMQX_SUPERUSER,
    keepalive: 60,
    reconnectPeriod: 5000,
    protocolId: "MQIsdp",
    protocolVersion: 3,
    clean: true,
    encoding: "utf8",
  };
  client = mqtt.connect("mqtt://localhost", options);
  client.on("connect", function () {
    console.log(">>> MQTT client connected successfully.".green);
  });
  client.on("reconnect", function () {
    console.log(">>> MQTT client REconnected successfully.".green);
  });
  client.on("error", function () {
    console.log(">>> MQTT client connection failed.".red);
  });
};

function sendMqttNotification(notification) {
  let topic = notification.userId + "/deviceId/variable/notification";
  let msg = `ALERT: ${notification.variable} = ${notification.payload.value}. This is ${notification.condition} ${notification.value}.`;
  client.publish(topic, msg);
};

router.post("/saver", async (req, res) => { // webhook called when data.payload.save equals 1, defined on emqx rule.
  try {
    console.log("Webhook saver:".blue);
    console.log(`>>> token from emqx resource: ${req.headers.token}`.blue); // this token is defined on http://localhost:18083/#/resources > view
    if (req.headers.token !== "iotapp") {
      throw new Error("Invalid emqx token.")
    };
    let data = req.body;
    // check if device sending data really exists and then save data on mongo.
    let deviceId = data.topic.split("/")[1]; // userId/deviceId/variable/sdata
    let variable = data.topic.split("/")[2];
    let device = await Device.findOne({ _id: deviceId, userId: data.userId });
    if (device) {
      await DeviceData.create({
        "userId": data.userId,
        "deviceId": deviceId,
        "variable": variable,
        "value": data.payload.value,
        "time": Date.now(),
      });
    };
    res.status(200).send({ "message": "success" });
  } catch (error) {
    console.log("/saver error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.post("/alarm", async (req, res) => { // webhook called by emqx alarm resource.
  try {
    console.log("Webhook alarm:".blue);
    console.log(`>>> token from emqx resource: ${req.headers.token}`.blue); // this token is defined on http://localhost:18083/#/resources > view
    if (req.headers.token !== "iotapp") {
      throw new Error("Invalid emqx token.")
    };
    let alertReceived = req.body;
    // check time passed between notifications
    let lastNotification = await Notification.findOne({ deviceId: alertReceived.deviceId, emqxRuleId: alertReceived.emqxRuleId }).sort({ createdAt: -1 });
    if (!lastNotification) {
      console.log("> new notification.".blue);
      Notification.create(alertReceived);
      sendMqttNotification(alertReceived);
    }
    else { // check triggerTimeInterval (minutes)
      let timeBetweenNotifications = (new Date().getTime() - new Date(lastNotification.createdAt).getTime())/1000/60; // minutes
      if (timeBetweenNotifications > alertReceived.triggerTimeInterval) {
        console.log("> repeat notification.".blue);
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
