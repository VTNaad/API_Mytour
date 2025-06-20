const mongoose = require("mongoose");

const hotelCommentSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  name: String,
  content: String,
  rating: { type: Number, min: 1, max: 10 },
  groupType: String,
  roomType: String,
  nights: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HotelComment", hotelCommentSchema);
