const slugify = require("slugify");
const Hotel = require("../models/Hotel");

class HotelController {
  async createHotel(req, res) {
    try {
      const {
        name,
        address,
        province,
        district,
        description,
        amenities,
        // pricePerNight,
        location,
        starRating,
        checkInTime,
        checkOutTime,
        policies,
        contact,
      } = req.body;

      if (!name || !address || !req.files?.length) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Chuyển chuỗi tiện nghi thành mảng nếu cần
      const amenitiesArray =
        typeof amenities === "string"
          ? amenities.split(",").map((item) => item.trim())
          : Array.isArray(amenities)
          ? amenities
          : [];

      // Lấy URL ảnh từ Cloudinary đã upload sẵn
      const imageUrls = req.files.map((file) => file.path);

      // Parse location nếu là JSON string
      const parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;

      const newHotel = new Hotel({
        name,
        slug: slugify(name, { lower: true, strict: true }),
        address,
        province,
        district,
        description,
        amenities: amenitiesArray,
        // pricePerNight,
        location: parsedLocation,
        starRating: starRating ? Number(starRating) : undefined,
        checkInTime,
        checkOutTime,
        policies: policies ? JSON.parse(policies) : undefined,
        contact: contact ? JSON.parse(contact) : undefined,
        images: imageUrls,
      });

      await newHotel.save();

      res.status(201).json({ success: true, data: newHotel });
    } catch (err) {
      console.error("Error creating hotel:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAllHotel(req, res) {
    try {
      const hotels = await Hotel.find();
      res.json({ success: true, data: hotels });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getHotelById(req, res) {
    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel)
        return res
          .status(404)
          .json({ success: false, message: "Hotel not found" });
      res.json({ success: true, data: hotel });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getHotelsByProvince(req, res) {
    try {
      const { province } = req.params;
      const hotels = await Hotel.find({ province: new RegExp(province, "i") }); // Tìm không phân biệt hoa thường
      res.status(200).json({ success: true, data: hotels });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getHotelsByDistrict(req, res) {
    try {
      const { district } = req.params;
      const hotels = await Hotel.find({ district: new RegExp(district, "i") });
      res.status(200).json({ success: true, data: hotels });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateHotel(req, res) {
    try {
      const { id } = req.params;

      const {
        name,
        address,
        province,
        district,
        description,
        amenities,
        pricePerNight,
        location,
        starRating,
        checkInTime,
        checkOutTime,
        policies,
        contact,
      } = req.body;

      const updateData = {
        ...(name && {
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }),
        ...(address && { address }),
        ...(province && { province }),
        ...(district && { district }),
        ...(description && { description }),
        ...(pricePerNight && { pricePerNight }),
        ...(starRating && { starRating }),
        ...(checkInTime && { checkInTime }),
        ...(checkOutTime && { checkOutTime }),
        ...(policies && { policies: JSON.parse(policies) }),
        ...(contact && { contact: JSON.parse(contact) }),
      };

      if (location) {
        updateData.location =
          typeof location === "string" ? JSON.parse(location) : location;
      }

      if (amenities) {
        updateData.amenities =
          typeof amenities === "string"
            ? amenities.split(",").map((a) => a.trim())
            : Array.isArray(amenities)
            ? amenities
            : [];
      }

      if (req.files?.length) {
        updateData.images = req.files.map((file) => file.path);
      }

      const updatedHotel = await Hotel.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!updatedHotel) {
        return res
          .status(404)
          .json({ success: false, message: "Hotel not found" });
      }

      res.status(200).json({ success: true, data: updatedHotel });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteHotel(req, res) {
    try {
      const { id } = req.params;
      const deletedHotel = await Hotel.findByIdAndDelete(id);

      if (!deletedHotel) {
        return res
          .status(404)
          .json({ success: false, message: "Hotel not found" });
      }

      res
        .status(200)
        .json({ success: true, message: "Hotel deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async filterHotels(req, res) {
    try {
      const { minPrice, maxPrice, starRating, amenities, province, district } =
        req.query;

      const filter = {};

      if (minPrice || maxPrice) {
        filter.pricePerNight = {};
        if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
        if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
      }

      if (starRating) {
        filter.starRating = { $in: starRating.split(",").map(Number) };
      }

      if (amenities) {
        filter.amenities = { $all: amenities.split(",") };
      }

      if (province) {
        filter.province = new RegExp(province, "i");
      }

      if (district) {
        filter.district = new RegExp(district, "i");
      }

      const hotels = await Hotel.find(filter);
      res.status(200).json({ success: true, data: hotels });
    } catch (err) {
      console.error("Error filtering hotels:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRecommendedRooms(req, res) {
    try {
      const { hotelId } = req.params;

      // Giả sử mỗi khách sạn có danh sách phòng trong trường `rooms`
      const hotel = await Hotel.findById(hotelId).populate("rooms"); // Populate nếu có liên kết với model Room
      if (!hotel) {
        return res
          .status(404)
          .json({ success: false, message: "Hotel not found" });
      }

      // Lọc danh sách phòng được đề xuất (ví dụ: dựa trên giá hoặc đánh giá)
      const recommendedRooms = hotel.rooms.filter((room) => room.isRecommended);

      res.status(200).json({ success: true, data: recommendedRooms });
    } catch (err) {
      console.error("Error fetching recommended rooms:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new HotelController();
