const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true }, // Tên không dấu dùng trong URL
    address: { type: String, required: true },
    province: { type: String }, // ví dụ: "Hồ Chí Minh"
    district: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    description: { type: String },
    images: [{ type: String }], // URLs từ Cloudinary
    amenities: [{ type: String }], // Tiện nghi "Wifi, Hồ bơi, Điều hòa,..."
    starRating: { type: Number, min: 1, max: 5, default: undefined},
    pricePerNight: { type: Number },
    checkInTime: { type: String }, // "14:00"
    checkOutTime: { type: String }, // "12:00"
    policies: {
      cancellationPolicy: { type: String },
      paymentPolicy: { type: String },
    },
    contact: {
      phone: { type: String },
      email: { type: String },
    },
    isActive: { type: Boolean, default: true }, // Ẩn khách sạn
  },
  { timestamps: true }
);

hotelSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Hotel", hotelSchema);
