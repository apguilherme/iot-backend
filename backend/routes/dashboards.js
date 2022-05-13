const express = require("express");
const router = express.Router();
const colors = require("colors");
const Dashboard = require("../models/Dashboard.js");

router.get("/all", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let dashboards = await Dashboard.find({ userID })
        .populate('user', ["id", "name", "email"])
        .populate('widgets.device');
    res.status(200).send({ "message": "success", "dashboards": dashboards });
  } catch (error) {
    console.log("/all error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.get("/:dashboardID", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let _id = req.params.dashboardID;
    let dashboard = await Dashboard.findOne({ userID, _id })
        .populate('user', ["id", "name", "email"])
        .populate('widgets.device');
    res.status(200).send({ "message": "success", "dashboard": dashboard });
  } catch (error) {
    console.log("/:dashboardID error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.post("/create", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let body = req.body;
    let dashboard = await Dashboard.create({
      user: userID,
      name: body.name,
      description: body.description,
      widgets: body.widgets,
    });
    res.status(200).send({ "message": "success", "dashboardCreated": dashboard });
  } catch (error) {
    console.log("/create error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.delete("/delete/:dashboardID", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let _id = req.params.dashboardID;
    let dashboard = await Dashboard.deleteOne({ userID, _id });
    res.status(200).send({ "message": "success", "dashboardDeleted": dashboard });
  } catch (error) {
    console.log("/delete/:dashboardID error:".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.put("/update/:dashboardID", async (req, res) => {
  try {
    let userID = req.userInfo.id;
    let _id = req.params.dashboardID;
    let body = req.body;
    let dashboard = await Dashboard.findOneAndUpdate({ userID, _id }, { ...body });
    res.status(200).send({ "message": "success", "dashboardUpdated": dashboard });
  } catch (error) {
    console.log("/update/:dashboardID: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

module.exports = router;