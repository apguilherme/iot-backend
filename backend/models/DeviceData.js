const mongoose = require("mongoose");

const saverSchema = new mongoose.Schema({
    userId: { type: String, required: [true] },
    deviceId: { type: String, required: [true] },
    variable: { type: String, required: [true] },
    value: { type: String, required: [true] },
    time: { type: Number, required: [true] }, // time data was sent
});

const DeviceData = mongoose.model("DeviceData", saverSchema);

module.exports = DeviceData;
