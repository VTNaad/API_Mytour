const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  people: Number,
  maxPeople: Number,
  standardPeople: Number,
  area: String,
  view: String,
  beds: String,
  quantity: { type: Number, min: 0 },
  price: Number, // Giá gốc
  serviceFee: { type: Number, default: 0 }, // Thêm phí dịch vụ
  cashback: Number,
  childrenPolicy: String,
  recentBookedHoursAgo: Number,
  images: [String],
  amenities: [String],
  policies: {
    cancellation: String,
    breakfast: String,
    confirmation: String,
    invoice: String,
    extra: String,
  },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
}, { timestamps: true });

roomSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: "all" });

module.exports = mongoose.model("Room", roomSchema);
