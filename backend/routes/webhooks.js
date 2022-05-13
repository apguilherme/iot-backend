const express = require("express");
const router = express.Router();

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

router.post("/saver", async (req, res) => {
  try {
    let body = req.body;
    console.log(body);
    res.status(200).send({ "message": "success" });
  } catch (error) {
    console.log("/saver error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.post("/alarm", async (req, res) => {
  try {
    let body = req.body;
    console.log(body);
    res.status(200).send({ "message": "success" });
  } catch (error) {
    console.log("/alarm error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

module.exports = router;
