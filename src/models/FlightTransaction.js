const mongoose = require("mongoose");

const flightTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "OrderFlight", required: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: "Flight", required: true },
  price: { type: Number, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model("FlightTransaction", flightTransactionSchema);
