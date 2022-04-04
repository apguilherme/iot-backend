const express = require("express");
const router = express.Router();
const Device = require("../models/Device.js");

router.get("/all", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let devices = await Device.find({ userID }).populate('user', ["id", "name", "email"]);
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
    let _id = req.params.deviceID;
    let device = await Device.deleteOne({ userID, _id });
    res.status(200).send({ "message": "success", "deviceDeleted": device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.put("/update/:deviceID", async (req, res) => {
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

module.exports = router;