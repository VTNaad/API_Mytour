const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const OrderFlight = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  contactInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  passengerInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  note: String,
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'cancelled'], default: 'pending' },
  isBookingForOthers: { type: Boolean, default: false },
  paymentMethod: String,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' }
}, {
  timestamps: true
});

OrderFlight.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("OrderFlight", OrderFlight);