const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const colors = require("colors");
const PORT = 3000;
const authorize = require("./middleware/auth.js"); // middleware method to validate token, puts on req: "userInfo": { "name": "", "email": "", "id": "" }

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
morgan.token('body', req => { return JSON.stringify(req.body) });
app.use(morgan(':method :url :body :status :res[content-length] :response-time ms'));

// endpoints
app.use("/api/users", require("./routes/users.js")); // my-iot-db.users
app.use("/api/devices", authorize, require("./routes/devices.js"));

app.get("/", (req, res) => {
  res.send({ "status": "running..." });
});

// db connection
const mongoUser = "admin"
const mongoPass = "passiot"
const mongoHost = "localhost"
const mongoPort = "27017"
const mongoDb = "my-iot-db"
var uri = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDb}`
var options = { useNewUrlParser: true, useUnifiedTopology: true, authSource: "admin" }
mongoose.connect(uri, options).then(() => {
  console.log(">>> Connected to db.".green)
}, (error) => {
  console.log(">>> Not connected to db: ".red + error)
})

// server
app.listen(PORT, () => {
  console.log(`>>> Server running: http://localhost:${PORT}`.green);
});
