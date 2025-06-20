const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const transactionSchema = new mongoose.Schema(
  {
    orderId: String,
    amount: Number,
    payDate: Date,
    bankCode: String,
    bankTranNo: String,
    cardType: String,
    vnpTransactionNo: String,
    orderInfo: String,
    status: String, // "Success" | "Failed"
  },
  { timestamps: true }
);

transactionSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Transaction", transactionSchema);
