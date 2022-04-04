const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true] },
    name: { type: String, required: [true] },
    description: { type: String, required: [true] },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
