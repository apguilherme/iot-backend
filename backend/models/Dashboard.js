const mongoose = require("mongoose");

const widgetSchema = new mongoose.Schema({
    type: { type: String, required: [true] },
    name: { type: String, required: [true] },
    description: { type: String, required: [true] },
    icon: { type: String },
    unit: { type: String }, // cannot be required
    timeInterval: { type: Number, required: [true] },
    size: { type: String, required: [true] },
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: [true] },
    variableFromDevice: { type: String, required: [true] },
});

const dashboardSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true] },
    widgets: [widgetSchema],
    name: { type: String, required: [true] },
    description: { type: String, required: [true] },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Dashboard = mongoose.model("Dashboard", dashboardSchema);
const Widget = mongoose.model("Widget", widgetSchema);

module.exports = Dashboard;
