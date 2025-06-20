const Favorite = require("../models/Favorite");
const Hotel = require("../models/Hotel");

class favoriteController {
  async add(req, res) {
    const { userId, hotelId } = req.body;
    try {
      const existing = await Favorite.findOne({ userId, hotelId });
      if (existing) {
        return res.status(400).json({ success: false, message: "Already favorited" });
      }
      const favorite = new Favorite({ userId, hotelId });
      await favorite.save();
      res.json({ success: true, favorite });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async remove(req, res) {
    const { userId, hotelId } = req.body;
    try {
      await Favorite.findOneAndDelete({ userId, hotelId });
      res.json({ success: true, message: "Removed from favorites" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getUserFavorites(req, res) {
    const { userId } = req.params;

    try {
      const favorites = await Favorite.find({ userId });

      // Lấy danh sách hotelId
      const hotelIds = favorites.map((f) => f.hotelId);

      // Lấy chi tiết khách sạn
      const hotels = await Hotel.find({ _id: { $in: hotelIds } });

      res.json({ success: true, favoriteHotels: hotels });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async isFavorite(req, res) {
    const { userId, hotelId } = req.query;
    try {
      const exists = await Favorite.exists({ userId, hotelId });
      res.json({ success: true, isFavorite: !!exists });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new favoriteController();
