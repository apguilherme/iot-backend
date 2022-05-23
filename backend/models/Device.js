const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true] },
    name: { type: String, required: [true] },
    description: { type: String, required: [true] },
    password: { type: String, required: [true] }, // dynamic password to authorize device to get credentials at /devicecredentials
    isActive: { type: Boolean, default: false, required: [true] },
    variables: [{ type: String, required: [true] }],
}, { timestamps: true });

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
