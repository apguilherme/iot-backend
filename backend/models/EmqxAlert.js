const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
    userId: { type: String, required: [true] },
    deviceId: { type: String, required: [true] },
    emqxRuleId: { type: String, required: [true] },
    name: { type: String, required: [true] },
    description: { type: String, required: [true] },
    status: { type: Boolean, required: [true] }, // true if it is to be alerted
    variable: { type: String, required: [true] },
    value: { type: String, required: [true] },
    condition: { type: String, required: [true] },
    triggerTimeInterval: { type: String, required: [true] },
}, { timestamps: true });

const EmqxAlert = mongoose.model("EmqxAlert", alertSchema);

module.exports = EmqxAlert;
