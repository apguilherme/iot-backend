const mongoose = require("mongoose");

const widgetSchema = new mongoose.Schema({
    type: { type: String, required: [true] },
    name: { type: String },
    description: { type: String },
    icon: { type: String },
    unit: { type: String },
    timeInterval: { type: Number, required: [true] },
    size: { type: String },
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: [true] },
});

const dashboardSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true] },
    widgets: [widgetSchema],
    name: { type: String, required: [true] },
    description: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Dashboard = mongoose.model("Dashboard", dashboardSchema);
const Widget = mongoose.model("Widget", widgetSchema);

module.exports = Dashboard;
