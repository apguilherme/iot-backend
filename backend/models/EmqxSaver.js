const mongoose = require("mongoose");

const saverSchema = new mongoose.Schema({
    userId: { type: String, required: [true] },
    deviceId: { type: String, required: [true], unique: true },
    emqxRuleId: { type: String, required: [true] },
    status: { type: Boolean, required: [true] }, // true if it is to be saved
}, { timestamps: true });

const EmqxSaver = mongoose.model("EmqxSaver", saverSchema);

module.exports = EmqxSaver;
