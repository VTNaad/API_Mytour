const Tour = require("../models/Tour");

class TourController {
  async createTour(req, res) {
    try {
      const tour = new Tour(req.body);
      await tour.save();
      res.status(201).json(tour);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getAllTour(req, res) {
    try {
      const tours = await Tour.find();
      res.json(tours);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getOneTour(req, res) {
    try {
      const tour = await Tour.findById(req.params.id);
      res.json(tour);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async updateTour(req, res) {
    try {
      const updatedTour = await Tour.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.json(updatedTour);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async deleteTour(req, res) {
    try {
      await Tour.findByIdAndDelete(req.params.id);
      res.json({ message: "Tour deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new TourController();
