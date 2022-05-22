require('dotenv').config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');

const jwtSecret = process.env.JWT_SECRET;
const User = require("../models/User.js");
const EmqxAuthRule = require("../models/EmqxAuthRule.js");
const authorize = require("../middleware/auth.js");

// USER: my-iot-db.users

router.post("/register", async (req, res) => {
  try {
    let body = req.body;
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
    console.log("/user error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.delete("/delete", authorize, async (req, res) => {
  try {
    let _id = req.userInfo.id;
    let user = await User.deleteOne({ _id });
    res.status(200).send({ "message": "success", "userDeleted": user });
  } catch (error) {
    console.log("/delete error: ".red + error);
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
    console.log("/update error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

// BROKER EMQX CREDENTIALS: my-iot-db.emqxauthrules

router.get("/brokerauth", authorize, async (req, res) => {
  // security: this generates a new user/pass everytime user start a connection to emqx broker, when page refreshes.
  try {
    let userID = req.userInfo.id;
    let credentials = await getAndGenerateCredentials(userID);
    res.status(200).send({ "message": "success", "credentials": { 
      brokerUser: credentials.username, 
      brokerPass: credentials.password
    } });
    setTimeout(() => {
      // call it again after 30s to avoid someone else to connect using same credentials.
      getAndGenerateCredentials(userID);
    }, 30000);
  } catch (error) {
    console.log("/brokerauth error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

router.get("/brokerauthreconn", authorize, async (req, res) => {
  // when trying to reconnect to broker, return the current credentials from db.
  try {
    let userID = req.userInfo.id;
    let credentials = await getCredentialsReconnect(userID);
    res.status(200).send({ "message": "success", "credentials": { 
      brokerUser: credentials.username, 
      brokerPass: credentials.password
    } });
    setTimeout(() => {
      // call it again after 60s to avoid someone else to connect using same credentials.
      getAndGenerateCredentials(userID);
    }, 60000);
  } catch (error) {
    console.log("/brokerauthreconn error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
});

async function getAndGenerateCredentials(userID) {
  try {
    let credentials = await EmqxAuthRule.findOne({ type: "user", userId: userID });
    let credentialsReturn = null;
    if (!credentials) { // there is no credentials yet, create it.
      let newCred = {
        userId: userID,
        username: uuidv4(),
        password: uuidv4(),
        publish: [userID + "/#"], // allow to publish only at this user topics
        subscribe: [userID + "/#"], // allow to subscribe only at this user topics
        type: "user",
      };
      credentialsReturn = await EmqxAuthRule.create(newCred);
      console.log("User broker credentials created.".yellow, "userId:", userID);
    }
    else { // update credentials if exists, to avoid steal of credentials to connect to broker.
      let name = uuidv4();
      let pass = uuidv4();
      credentialsReturn = await EmqxAuthRule.findOneAndUpdate(
        { type: "user", userId: userID }, 
        { $set: { username: name, password: pass } },
        { new: true }, // flag to return the updated document
      );
      if (credentialsReturn) {
        console.log("User broker credentials updated.".yellow, "userId:", userID);
      }
    }
    return credentialsReturn;
  } catch (error) {
    console.log("/getAndGenerateCredentials error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
};

async function getCredentialsReconnect(userID) {
  try {
    let credentialsReturn = await EmqxAuthRule.findOne({ type: "user", userId: userID });
    if (credentialsReturn) {
      console.log("Found user broker credentials for reconnect.".yellow, "userId:", userID);
    }
    return credentialsReturn;
  } catch (error) {
    console.log("/getAndGenerateCredentialsReconnect error: ".red + error);
    res.status(500).json({ "message": "failure", "error": error });
  }
}

module.exports = router;
