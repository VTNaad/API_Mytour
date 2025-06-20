const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true },
  discountType: { type: String, enum: ["percent", "amount"], required: true },
  discountValue: { type: Number, required: true },

  // Nếu null → áp dụng cho tất cả khách sạn
  // Nếu có ObjectId → áp dụng cho 1 khách sạn cụ thể
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    default: null,
  },

  expiresAt: { type: Date, required: true },
  image: String,
}, {
  timestamps: true,
});

voucherSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Voucher", voucherSchema);
