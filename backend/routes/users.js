require('dotenv').config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const jwtSecret = process.env.JWT_SECRET;
const User = require("../models/User.js");
const authorize = require("../middleware/auth.js");

router.post("/register", async (req, res) => {
  try {
    let body = req.body;
    console.log(body)
    let encryptPass = bcrypt.hashSync(body.password, 10);
    let user = await User.create({
      name: body.name,
      email: body.email,
      password: encryptPass,
    });
    res.status(200).send({ "message": "success", "email": user.email });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.post("/login", async (req, res) => {
  try {
    let body = req.body;
    let user = await User.findOne({ email: body.email });
    if (!user) {
      res.status(404).json({ "message": "failure", "error": "User not found." });
    }
    else if (bcrypt.compareSync(body.password, user.password)) {
      let info = {
        "name": user.name,
        "email": user.email,
        "id": user._id
      };
      let token = jwt.sign(
        info,
        jwtSecret,
        { expiresIn: 60 * 60 * 24 * 30 }
      );
      res.status(200).send({ "message": "success", "token": token, "userInfo": info });
    }
    else {
      res.status(401).json({ "message": "failure", "error": "Invalid user credentials." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.get("/user", authorize, async (req, res) => {
  try {
    let _id = req.userInfo.id;
    let user = await User.findOne({ _id });
    res.status(200).send({ "message": "success", "userName": user.name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.delete("/delete", authorize, async (req, res) => {
  try {
    let _id = req.userInfo.id;
    let user = await User.deleteOne({ _id });
    res.status(200).send({ "message": "success", "userDeleted": user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.put("/update", authorize, async (req, res) => {
  try {
    let _id = req.userInfo.id;
    let body = req.body;
    let user = await User.findOneAndUpdate({ _id }, { ...body });
    res.status(200).send({ "message": "success", "userUpdated": user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

module.exports = router;
