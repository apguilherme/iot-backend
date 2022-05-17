const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: [true] },
    deviceId: { type: String, required: [true] },
    payload: { type: Object, required: [true] },
    emqxRuleId: { type: String, required: [true] },
    topic: { type: String, required: [true] },
    value: { type: String, required: [true] },
    condition: { type: String, required: [true] },
    variable: { type: String, required: [true] },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
