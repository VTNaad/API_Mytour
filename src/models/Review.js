const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const reviewSchema = new mongoose.Schema(
  {
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    user: String,
    rating: Number,
    comment: String,
  },
  { timestamps: true }
);

reviewSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Review", reviewSchema);
