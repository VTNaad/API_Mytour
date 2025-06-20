const mongoose = require("mongoose");
const mongooseSlugUpdater = require("mongoose-slug-updater");
var mongooseDelete = require("mongoose-delete");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

mongoose.plugin(mongooseSlugUpdater);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, maxLength: 255, required: true, unique: true },
    password: { type: String, required: true },
    fullname: { type: String, maxLength: 255, required: true },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dvdabwrng/image/upload/v1734276204/image/apxgytdnqcaj6mv1pllt.jpg",
    },
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    email: {
      type: String,
      maxLength: 255,
      required: true,
      validate: {
        validator: function (v) {
          // Regex kiểm tra định dạng email
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return v === null || /^\d{10}$/.test(v); // kiểm tra nếu chuỗi số điện thoại có đúng 10 số
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    role: { type: Number, ref: "Role", required: true, default: 3 },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null, // Chỉ áp dụng cho HotelManager
    },
    isBlocked: { type: Boolean, default: false },
    //refreshToken: { type: String },
    passwordReset: { type: String, default: null },
    passwordResetExpiry: { type: Date, default: null },
    // passwordChangedAt: { type: String },
    // passwordResetToken: { type: String },
    // passwordResetExpires: { type: String },
  },

  { timestamps: true }
);

userSchema.index({ email: 1, provider: 1 }, { unique: true });

const BCRYPT_COST = 4;

userSchema.pre("save", async function (next) {
  // nếu có chỉnh sửa thì hash
  if (this.isModified("password")) {
    const salt = bcrypt.genSaltSync(BCRYPT_COST);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Trước khi findOneAndUpdate
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    const salt = bcrypt.genSaltSync(BCRYPT_COST);
    update.password = await bcrypt.hash(update.password, salt);
  }
  next();
});

// kiểm tra password
userSchema.methods = {
  isCorrectPassword: async function (password) {
    return await bcrypt.compare(password, this.password);
  },
  createPasswordChangeToken: function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    return resetToken;
  },
};

// Add Plugins
userSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("User", userSchema);
