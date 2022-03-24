const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const deviceSchema = new mongoose.Schema({
    userID: { type: String, required: [true] },
    deviceID: { type: String, required: [true], unique: true },
    name: { type: String, required: [true] },
    selected: { type: Boolean, required: [true], default: false },
    templateID: { type: String, required: [true] },
    templateName: { type: String, required: [true] }
}, { timestamps: true });

deviceSchema.plugin(uniqueValidator, { message: "Error: device already exists." });

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
