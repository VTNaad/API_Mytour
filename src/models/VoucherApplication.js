// models/VoucherApplication.js
const mongoose = require("mongoose");

const voucherApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Hotel ID in this case
  appliedAt: { type: Date, default: Date.now }
});

// Ensure one voucher per user per service
voucherApplicationSchema.index(
  { userId: 1, serviceId: 1 }, 
  { unique: true }
);

module.exports = mongoose.model("VoucherApplication", voucherApplicationSchema);