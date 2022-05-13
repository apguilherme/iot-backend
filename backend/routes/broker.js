const express = require("express");
const router = express.Router();
const axios = require("axios");
const colors = require("colors");

const auth = {
    auth: {
        username: "admin",
        password: "passiot"
    }
};

global.resourceSaver = null;
global.resourceAlarm = null;
const EMQX_API_RESOURCES = "http://localhost:8085/api/v4/resources/";

async function getResources() {
    let url = EMQX_API_RESOURCES; 
    let res = await axios.get(url, auth);
    if (res.status === 200) {
        let size = res.data.data.length;
        if (size === 0) { // no resources = create it
            console.log("creating emqx webhook resource...");
            await createResources();
        }
        else if( size === 2) { // resources exists
            res.data.data.forEach(resource => {
                if (resource.description == "alarm-webhook") {
                    global.resourceAlarm = resource;
                    console.log("resourceAlarm: ".blue, global.resourceAlarm);
                  }
                  if (resource.description == "saver-webhook") {
                    global.resourceSaver = resource;
                    console.log("resourceSaver: ".blue, global.resourceSaver);
                  }
            })
        }
        else { 
            console.log("Delete all webhook emqx resources and restart node.".red)
        }
    }
    else {
        console.log("getResources error".red);
    }
    return res;
}

async function createResources() {
    let url = EMQX_API_RESOURCES;
    let payloadSaver = {
        "type": "web_hook",
        "config": {
            url: "http://localhost:3000/api/webhooks/saver",
            headers: { token: "iotapp" },
            method: "POST"
        },
        description: "saver-webhook"
    };
    let payloadAlarm = {
        "type": "web_hook",
        "config": {
            url: "http://localhost:3000/api/webhooks/alarm",
            headers: { token: "iotapp" },
            method: "POST"
        },
        description: "alarm-webhook"
    };
    try {
        let resSaver = await axios.post(url, payloadSaver, auth);
        let resAlarm = await axios.post(url, payloadAlarm, auth);
        if (resAlarm.status === 200) {
            console.log("Resource alarm created.".green);
        }
        if (resSaver.status === 200) {
            console.log("Resource saver created.".green);
        }
    } catch (error) {
        console.log("createResources error: ".red, error);
        return { "message": "failure", "error": error };
    }
}

router.get("/resources", async (req, res) => { // localhost:3000/api/broker/resources
  try {
    let resources = await getResources();
    if (resources.data.data.length === 0) { // second call in case no resources at first call
        resources = await getResources();
    }
    res.status(200).send(resources.data.data);
  } catch (error) {
    console.log("resources error: ".red + error);
  }
});

module.exports = router;
