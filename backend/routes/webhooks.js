const express = require("express");
const router = express.Router();
const colors = require("colors");

const DeviceData = require("../models/DeviceData.js");
const Device = require("../models/Device.js");

router.post("/test", async (req, res) => {
  try {
    let body = req.body;
    console.log(body);
    res.status(200).send({ "message": "success" });
  } catch (error) {
    console.log("/test error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.post("/saver", async (req, res) => { // webhook called when data.payload.save equals 1, defined on emqx rule.
  try {
    console.log(`>>> token from emqx resource: ${req.headers.token}`.blue); // this token is defined on http://localhost:18083/#/resources > view
    if (req.headers.token !== "iotapp") {
      throw new Error("Invalid emqx token.")
    };
    let data = req.body;
    // check if device sending data really exists and then save on mongo.
    let deviceId = data.topic.split("/")[1];
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

router.post("/alarm", async (req, res) => {
  try {
    let body = req.body;
    res.status(200).send({ "message": "success" });
  } catch (error) {
    console.log("/alarm error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

module.exports = router;
