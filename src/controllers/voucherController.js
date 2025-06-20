const Voucher = require("../models/Voucher");
const mongoose = require("mongoose");
const { imageUpload } = require("../config/cloudinary");

class VoucherController {
  async getVouchersByHotel(req, res) {
    try {
      const { hotelId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        return res.status(400).json({ error: "hotelId không hợp lệ" });
      }

      const vouchers = await Voucher.find({
        hotelId: new mongoose.Types.ObjectId(hotelId),
        // expiresAt: { $gte: new Date() }  // (tuỳ chọn) lọc những voucher còn hạn
      });

      if (vouchers.length === 0) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy voucher nào cho khách sạn này" });
      }

      res.json(vouchers);
    } catch (error) {
      console.error("Lỗi getVouchersByHotel:", error);
      res
        .status(500)
        .json({ error: "Lỗi server khi lấy voucher theo khách sạn" });
    }
  }

  async getAll(req, res) {
    try {
      const vouchers = await Voucher.find().populate("hotelId"); // <-- thêm populate
      res.json(vouchers);
    } catch (err) {
      res.status(500).json({ error: "Lỗi server khi lấy danh sách voucher" });
    }
  }

  // Tạo mới voucher
  async createVoucher(req, res) {
    imageUpload.single("image")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Lỗi tải ảnh",
          error: err.message,
        });
      }
      const { code, discountType, discountValue, hotelId, expiresAt } =
        req.body;
      if (req.file && req.file.path) {
        req.body.image = req.file.path;
      }

      try {
        const voucher = new Voucher({
          code,
          discountType,
          discountValue,
          hotelId: hotelId || null,
          expiresAt,
        });
        await voucher.save();
        res.json(voucher);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  // Áp dụng mã voucher (chỉ dùng được nếu hotelId phù hợp hoặc hotelId trong voucher = null)
  async applyVoucher(req, res) {
    const { code, hotelId } = req.query;

    try {
      const voucher = await Voucher.findOne({ code });

      if (!voucher || new Date(voucher.expiresAt) < new Date()) {
        return res
          .status(404)
          .json({ error: "Mã không hợp lệ hoặc đã hết hạn" });
      }

      if (voucher.hotelId) {
        if (!hotelId || hotelId !== voucher.hotelId.toString()) {
          return res.status(403).json({
            error: "Mã này chỉ áp dụng cho khách sạn cụ thể",
          });
        }
      }

      return res.json({ success: true, voucher });
    } catch (error) {
      console.error("applyVoucher error:", error);
      return res.status(500).json({ error: "Lỗi server khi kiểm tra mã" });
    }
  }

  // Lấy voucher theo ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const voucher = await Voucher.findById(id);

      if (!voucher) {
        return res.status(404).json({ error: "Voucher không tồn tại" });
      }

      res.json(voucher);
    } catch (error) {
      res.status(500).json({ error: "Lỗi server khi lấy voucher theo ID" });
    }
  }

  // Cập nhật voucher
  async updateVoucher(req, res) {
    imageUpload.single("image")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Lỗi tải ảnh",
          error: err.message,
        });
      }

      if (req.file && req.file.path) {
        req.body.image = req.file.path;
      }

      try {
        const updated = await Voucher.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        if (!updated) {
          return res.status(404).json({ message: "Không tìm thấy voucher" });
        }
        res.status(200).json({ success: true, data: updated });
      } catch (err) {
        res.status(400).json({ success: false, message: err.message });
      }
    });
  }

  // Xoá voucher
  async deleteVoucher(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Voucher.findByIdAndDelete(id);

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy voucher" });
      }

      res
        .status(200)
        .json({ success: true, message: "Xoá voucher thành công" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new VoucherController();
