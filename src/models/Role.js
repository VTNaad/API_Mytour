const mongoose = require("mongoose");
const mongooseSlugUpdater = require("mongoose-slug-updater");
var mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);

mongoose.plugin(mongooseSlugUpdater);

const roleSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: { type: String, maxLength: 255, required: true, unique: true },
  },

  { timestamps: true }
);

// Add Plugins
roleSchema.plugin(AutoIncrement, { id: "role_seq", inc_field: "_id" });

roleSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Role", roleSchema);
