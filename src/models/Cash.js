const mongoose = require("mongoose");
const { Schema } = mongoose;

const cashSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  money: {
    type: Number,
    default: 1000000, // Số dư khởi tạo
    min: 0
  },
  level: {
    type: String,
    enum: ["bronze", "silver", "gold", "diamond"],
    default: "bronze"
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Cập nhật updatedAt khi save
cashSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Tính toán level dựa trên totalSpent
cashSchema.methods.updateLevel = function () {
  if (this.totalSpent >= 15) {
    this.level = "diamond";
  } else if (this.totalSpent >= 10) {
    this.level = "gold";
  } else if (this.totalSpent >= 5) {
    this.level = "silver";
  } else {
    this.level = "bronze";
  }
};

module.exports = mongoose.model("Cash", cashSchema);