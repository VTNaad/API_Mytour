// const Room = require("../models/Room");

// class RoomController {
//   async getAllRooms(req, res) {
//     try {
//       const rooms = await Room.find();
//       res.status(200).json({ success: true, data: rooms });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   async getRoomById(req, res) {
//     try {
//       const room = await Room.findById(req.params.id);
//       if (!room)
//         return res
//           .status(404)
//           .json({ success: false, message: "Phòng không tồn tại." });
//       res.status(200).json({ success: true, data: room });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   async getRoomsByHotelId(req, res) {
//     try {
//       const { hotelId } = req.params;
//       const rooms = await Room.find({ hotel: hotelId });
//       if (!rooms.length) {
//         return res.status(404).json({
//           success: false,
//           message: "Không có phòng nào cho khách sạn này.",
//         });
//       }
//       res.status(200).json({ success: true, data: rooms });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   }

//   async createRoom(req, res) {
//     try {
//       let roomData = req.body;
//       if (roomData.policies) {
//         roomData.policies = JSON.parse(roomData.policies);
//       }
//       if (roomData.amenities) {
//         roomData.amenities =
//           typeof roomData.amenities === "string"
//             ? roomData.amenities.split(",").map((a) => a.trim())
//             : Array.isArray(amenities)
//             ? amenities
//             : [];
//       }
//       // Lấy URL ảnh từ Cloudinary đã upload sẵn
//       const imageUrls = req.files.map((file) => file.path);
//       roomData.images = imageUrls;
//       const room = new Room(roomData);
//       await room.save();
//       res.status(201).json({ success: true, data: room });
//     } catch (err) {
//       res.status(400).json({ success: false, message: err.message });
//     }
//   }

//   async updateRoom(req, res) {
//     try {
//       let roomData = req.body;
//       if (roomData.policies) {
//         roomData.policies = JSON.parse(roomData.policies);
//       }
//       if (roomData.amenities) {
//         roomData.amenities =
//           typeof roomData.amenities === "string"
//             ? roomData.amenities.split(",").map((a) => a.trim())
//             : Array.isArray(amenities)
//             ? amenities
//             : [];
//       }
//       // Lấy URL ảnh từ Cloudinary đã upload sẵn
//       const imageUrls = req.files.map((file) => file.path);
//       roomData.images = imageUrls;
//       const room = await Room.findByIdAndUpdate(req.params.id, roomData, {
//         new: true,
//       });
//       if (!room)
//         return res
//           .status(404)
//           .json({ success: false, message: "Phòng không tồn tại." });
//       res.status(200).json({ success: true, data: room });
//     } catch (err) {
//       res.status(400).json({ success: false, message: err.message });
//     }
//   }

//   async deleteRoom(req, res) {
//     try {
//       const room = await Room.findByIdAndDelete(req.params.id);
//       if (!room)
//         return res
//           .status(404)
//           .json({ success: false, message: "Phòng không tồn tại." });
//       res.status(200).json({ success: true, message: "Xoá phòng thành công." });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   }
// }

// module.exports = new RoomController();

const Room = require("../models/Room");
const updateHotelMinPrice = require("../util/updateHotelMinPrice");

class RoomController {
  async getAllRooms(req, res) {
    try {
      const rooms = await Room.find().populate("hotel");
      res.status(200).json({ success: true, data: rooms });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRoomById(req, res) {
    try {
      const room = await Room.findById(req.params.id).populate("hotel");
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Phòng không tồn tại.",
        });
      }
      res.status(200).json({ success: true, data: room });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRoomsByHotelId(req, res) {
    try {
      const { hotelId } = req.params;
      const rooms = await Room.find({ hotel: hotelId }).populate("hotel");
      if (!rooms.length) {
        return res.status(404).json({
          success: false,
          message: "Không có phòng nào cho khách sạn này.",
        });
      }
      res.status(200).json({ success: true, data: rooms });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createRoom(req, res) {
    try {
      let data = req.body;

      if (typeof data.policies === "string") {
        data.policies = JSON.parse(data.policies);
      }

      if (typeof data.amenities === "string") {
        data.amenities = data.amenities.split(",").map((a) => a.trim());
      }

      // Kiểm tra files từ form-data (upload hình) hoặc giữ nguyên nếu là từ raw
      const images = req.files?.map((file) => file.path) || data.images || [];
      data.images = images;

      if (data.quantity && data.quantity < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Số lượng phòng không thể âm" 
        });
      }
      
      const newRoom = new Room(data);
      await newRoom.save();

      await updateHotelMinPrice(newRoom.hotel);

      res.status(201).json({ success: true, data: newRoom });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }


  async updateRoom(req, res) {
    try {
      let data = req.body;

      if (typeof data.policies === "string") {
        data.policies = JSON.parse(data.policies);
      }

      if (typeof data.amenities === "string") {
        data.amenities = data.amenities.split(",").map((a) => a.trim());
      }

      const images = req.files.map((file) => file.path);
      data.images = images;

      const updatedRoom = await Room.findByIdAndUpdate(req.params.id, data, {
        new: true,
      });

      await updateHotelMinPrice(updatedRoom.hotel);
      if (!updatedRoom) {
        return res.status(404).json({ success: false, message: "Không tìm thấy phòng." });
      }

      res.status(200).json({ success: true, data: updatedRoom });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteRoom(req, res) {
    try {
      const room = await Room.findByIdAndDelete(req.params.id);
      await updateHotelMinPrice(room.hotel);
      if (!room) {
        return res.status(404).json({ success: false, message: "Phòng không tồn tại." });
      }
      res.status(200).json({ success: true, message: "Đã xoá phòng thành công." });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new RoomController();
