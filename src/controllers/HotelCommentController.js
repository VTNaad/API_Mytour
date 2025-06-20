const HotelComment = require("../models/HotelComment");
const Hotel = require("../models/Hotel");

async function updateHotelRating(hotelId) {
  try {    
    const comments = await HotelComment.find({ hotelId });
    console.log(`Tìm thấy ${comments.length} bình luận`);
    
    if (comments.length === 0) {
      await Hotel.findByIdAndUpdate(hotelId, { $unset: { starRating: 1 } });
      return;
    }

    const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
    const averageRating = totalRating / comments.length;

    const finalRating = Math.round((averageRating / 10) * 5);
    const clampedRating = Math.max(1, Math.min(5, finalRating));

    const result = await Hotel.findByIdAndUpdate(
      hotelId,
      { starRating: clampedRating },
      { new: true }
    );

  } catch (error) {
    throw error;
  }
}

class HotelCommentController {
  // Tạo bình luận mới cho hotelId được truyền trong params
    async create(req, res) {
      try {
        const hotelId = req.params.hotelId;
        if (!hotelId) {
          return res.status(400).json({ message: "Thiếu hotelId trong URL" });
        }

        // Tạo comment, gán hotelId từ params
        const comment = new HotelComment({
          hotelId,
          ...req.body,
        });

        await comment.save();
        console.log("✅ Bình luận đã được lưu");

        // try {
        //   await updateHotelRating(hotelId);
        // } catch (err) {
        //   console.error("❌ Lỗi khi gọi updateHotelRating:", err);
        // }

        res.status(201).json(comment);
      } catch (error) {
        res.status(500).json({ message: "Lỗi khi tạo comment", error });
      }
    }

  // Lấy danh sách bình luận theo hotelId, mới nhất trước
  async getByHotel(req, res) {
    try {
      const hotelId = req.params.hotelId;
      if (!hotelId) {
        return res.status(400).json({ message: "Thiếu hotelId trong URL" });
      }

      const comments = await HotelComment.find({ hotelId }).sort({
        createdAt: -1,
      });
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy comments", error });
    }
  }

  async getAllComments(req, res) {
    try {
      const comments = await HotelComment.find().populate("hotelId");
      res.status(200).json({ success: true, data: comments });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const commentId = req.params.id;

      if (!commentId) {
        return res
          .status(400)
          .json({ message: "Thiếu id bình luận trong URL" });
      }

      const comment = await HotelComment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Bình luận không tồn tại" });
      }

      const hotelId = comment.hotelId;
      await HotelComment.deleteOne({ _id: commentId });

      // Sau khi xóa comment thành công, cập nhật rating của khách sạn
      // await updateHotelRating(hotelId);

      res.status(200).json({ message: "Đã xóa bình luận" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xóa", error });
    }
  }

}

module.exports = new HotelCommentController();
