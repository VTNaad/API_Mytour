const Booking = require("../models/Booking");

class HistoryController {
  async getHistoryByUser(req, res) {
    try {
      const { userId } = req.params;
      const bookings = await Booking.find({ user: userId })
        .populate("serviceId")
        .sort({ createdAt: -1 });

      res.json(bookings);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new HistoryController();
