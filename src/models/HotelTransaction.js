const mongoose = require("mongoose");

const hotelTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  price: { type: Number, required: true },
  cancellationPolicy: { type: String, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model("HotelTransaction", hotelTransactionSchema);
