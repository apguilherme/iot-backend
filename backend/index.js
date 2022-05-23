require('dotenv').config();
const colors = require("colors");
require("log-timestamp")(function() { return `${new Date().toLocaleString()}:`.gray });
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const PORT = 3000;
const authorize = require("./middleware/auth.js"); // middleware method to validate token, puts on req: "userInfo": { "name": "", "email": "", "id": "" }

if (process.env.IS_DEV_ENV) {
  console.log(".env vars:".cyan)
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET}`.cyan)
  console.log(`EMQX_RESOURCE_TOKEN: ${process.env.EMQX_RESOURCE_TOKEN}`.cyan)
  console.log(`EMQX_SUPERUSER: ${process.env.EMQX_SUPERUSER}`.cyan)
  console.log(`EMQX_USER: ${process.env.EMQX_USER}`.cyan)
  console.log(`EMQX_PASS: ${process.env.EMQX_PASS}`.cyan)
  console.log(`EMQX_API_RULES: ${process.env.EMQX_API_RULES}`.cyan)
  console.log(`EMQX_RESOURCE_SAVER_WEBHOOK_ID: ${process.env.EMQX_RESOURCE_SAVER_WEBHOOK_ID}`.cyan)
  console.log(`EMQX_RESOURCE_ALARM_WEBHOOK_ID: ${process.env.EMQX_RESOURCE_ALARM_WEBHOOK_ID}`.cyan)
  console.log(`IS_DEV_ENV: ${process.env.IS_DEV_ENV}`.cyan)
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
morgan.token('body', req => { return JSON.stringify(req.body) });
app.use(morgan(':method :url :body :status :res[content-length] :response-time ms'));

// endpoints
app.use("/api/users", require("./routes/users.js")); // authorize used only at some of users endpoints
app.use("/api/devices", require("./routes/devices.js")); // authorize used only at some of devices endpoints
app.use("/api/dashboards", authorize, require("./routes/dashboards.js"));
app.use("/api/alerts", authorize, require("./routes/alerts.js"));
app.use("/api/webhooks", require("./routes/webhooks.js")); // used by emqx Resources for saver and alarm
// app.use("/api/broker", require("./routes/broker.js")); // test endpoint

// db connection
const mongoUser = "admin";
const mongoPass = "passiot";
const mongoHost = "localhost";
const mongoPort = "27017";
const mongoDb = "my-iot-db";
var uri = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDb}`;
var options = { useNewUrlParser: true, useUnifiedTopology: true, authSource: "admin" };
mongoose.connect(uri, options).then(() => {
  console.log(">>> Connected to db.".green);
}, (error) => {
  console.log(">>> Not connected to db: ".red + error);
})

// server
app.listen(PORT, () => {
  console.log(`>>> Server running: http://localhost:${PORT}`.green);
});
