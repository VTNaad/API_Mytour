const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const blogSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    image: String,
    author: String,
    tags: [String],
  },
  { timestamps: true }
);

blogSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Blog", blogSchema);
