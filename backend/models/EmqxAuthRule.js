const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const emqxAuthSchema = new Schema({
    userId: { type: String, required: [true] },
    deviceId: { type: String },
    username: { type: String, required: [true] },
    password: { type: String, required: [true] }, // dynamic password to get credentials
    publish: { type: Array },
    subscribe: { type: Array },
    type: { type: String, required: [true], enum: ["user", "device", "superuser"] },
}, { timestamps: true });

const EmqxAuthRule = mongoose.model('EmqxAuthRule', emqxAuthSchema);

module.exports = EmqxAuthRule;   
