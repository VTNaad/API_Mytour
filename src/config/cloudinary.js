const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Tạo cấu hình lưu trữ cho ảnh
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "image", // Thư mục lưu trữ ảnh trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"], // Định dạng ảnh cho phép
    resource_type: "image", // Để chỉ lưu trữ ảnh
  },
});

// Khởi tạo multer với storage cho ảnh
const imageUpload = multer({ storage: imageStorage });

module.exports = { imageUpload, cloudinary };
