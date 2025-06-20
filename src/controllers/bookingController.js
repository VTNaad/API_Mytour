const Booking = require("../models/Booking");

class BookingController {
  async createBooking(req, res) {
    try {
      const { user, serviceType, serviceId, quantity } = req.body;

      const newBooking = new Booking({
        user,
        serviceType,
        serviceId,
        quantity,
      });
      await newBooking.save();

      res.status(201).json({ success: true, data: newBooking });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAllBookings(req, res) {
    try {
      const bookings = await Booking.find()
        .populate("user")
        .populate("serviceId");
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      res.json(updatedBooking);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new BookingController();
