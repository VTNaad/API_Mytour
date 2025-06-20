const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    destination: String,
    price: Number,
    schedule: String,
    image: String,
    durationDays: Number,
  },
  { timestamps: true }
);

tourSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Tour", tourSchema);
