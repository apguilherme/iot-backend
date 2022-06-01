require('dotenv').config();
const colors = require("colors");
require("log-timestamp")(function() { return `${new Date().toLocaleString()}:`.gray });
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const authorize = require("./middleware/auth.js"); // middleware method to validate token, puts on req: "userInfo": { "name": "", "email": "", "id": "" }

console.log(`ENVIRONMENT: ${process.env.ENVIRONMENT}`.cyan)

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

app.get("/health", (req, res) => {
  // TODO: return emqx and mongo status...
  res.json({"message": "Backend running..."});
});

// db connection
const mongoUser = process.env.EMQX_USER;
const mongoPass = process.env.EMQX_PASS;
const mongoPort = `${process.env.MONGO_EXTERNAL_PORT}`;
const mongoHost = process.env.MONGO_HOST;
const mongoDb = "my-iot-db";
var uri = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDb}`;
var options = { useNewUrlParser: true, useUnifiedTopology: true, authSource: "admin" };
mongoose.connect(uri, options).then(() => {
  console.log(">>> Connected to db.".green);
}, (error) => {
  console.log(">>> Not connected to db: ".red + error);
})

// server
app.listen(process.env.API_PORT, () => {
  console.log(`>>> Server running: http://localhost:${process.env.API_PORT}`.green);
});
