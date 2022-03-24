const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true] },
    email: { type: String, required: [true], unique: true },
    password: { type: String, required: [true] },
}, { timestamps: true });

userSchema.plugin(uniqueValidator, { message: "Error: email already exists." });

const User = mongoose.model("User", userSchema);

module.exports = User;
