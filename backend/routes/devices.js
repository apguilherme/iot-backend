const express = require("express");
const router = express.Router();
const Device = require("../models/Device.js");

router.get("/all", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let devices = await Device.find({ userID: userID });
    res.status(200).send({ "message": "success", "devices": devices });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.get("/:deviceID", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let deviceID = req.params.deviceID;
    let device = await Device.findOne({ userID: userID, _id: deviceID });
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
      userID: userID,
      deviceID: body.deviceID,
      name: body.name,
      selected: body.selected,
      templateID: body.templateID,
      templateName: body.templateName
    });
    res.status(200).send({ "message": "success", "deviceCreated": device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.delete("/delete/:deviceID", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let deviceID = req.params.deviceID;
    let device = await Device.deleteOne({ userID: userID, _id: deviceID });
    res.status(200).send({ "message": "success", "deviceDeleted": device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.put("/update", async (req, res) => {
  // https://ibm-learning.udemy.com/course/iot-god-level/learn/lecture/25088452#questions
  try {
    let userID = req.userInfo.id;
    let body = req.body;
    let device = await Device.update({
      userID: userID,
      deviceID: body.deviceID,
      name: body.name,
      selected: body.selected,
      templateID: body.templateID,
      templateName: body.templateName
    });
    res.status(200).send({ "message": "success", "deviceUpdated": device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

module.exports = router;