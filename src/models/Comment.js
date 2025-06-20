const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const commentSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog" },
  user: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

commentSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Comment", commentSchema);
