const HotelTransaction = require("../models/HotelTransaction");
const FlightTransaction = require("../models/FlightTransaction");

class TransactionController {
  // Tạo giao dịch khách sạn
  async createHotelTransaction(req, res) {
    try {
      const {
        user,
        order,
        hotel,
        room,
        price,
        cancellationPolicy
      } = req.body;

      const transaction = new HotelTransaction({
        user,
        order,
        hotel,
        room,
        price,
        cancellationPolicy
      });

      await transaction.save();
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Tạo giao dịch chuyến bay
  async createFlightTransaction(req, res) {
    try {
      const {
        user,
        order,
        flight,
        price
      } = req.body;

      const transaction = new FlightTransaction({
        user,
        order,
        flight,
        price
      });

      await transaction.save();
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Lấy tất cả giao dịch theo người dùng
  async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;

      const hotelTransactions = await HotelTransaction.find({ user: userId })
        .populate("hotel room order");
      const flightTransactions = await FlightTransaction.find({ user: userId })
        .populate("flight order");

      res.status(200).json({
        success: true,
        data: {
          hotelTransactions,
          flightTransactions
        }
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getAllTransactions(req, res) {
    try {
      const { page = 1, limit = 10, type } = req.query;
      const skip = (page - 1) * limit;

      let query = {};
      if (type) {
        query = { ...query, _type: type }; // 'hotel' hoặc 'flight'
      }

      const [hotelTransactions, flightTransactions] = await Promise.all([
        HotelTransaction.find(query)
          .populate("user hotel room order")
          .skip(skip)
          .limit(limit),
        FlightTransaction.find(query)
          .populate("user flight order")
          .skip(skip)
          .limit(limit),
      ]);

      const totalHotel = await HotelTransaction.countDocuments(query);
      const totalFlight = await FlightTransaction.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          hotelTransactions,
          flightTransactions,
          pagination: {
            total: totalHotel + totalFlight,
            page: Number(page),
            limit: Number(limit),
          },
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Lấy chi tiết giao dịch khách sạn
  async getHotelTransactionDetail(req, res) {
    try {
      const { id } = req.params;
      const transaction = await HotelTransaction.findById(id)
        .populate("user hotel room order");

      if (!transaction) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
      }

      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Lấy chi tiết giao dịch chuyến bay
  async getFlightTransactionDetail(req, res) {
    try {
      const { id } = req.params;
      const transaction = await FlightTransaction.findById(id)
        .populate("user flight order");

      if (!transaction) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
      }

      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

}

module.exports = new TransactionController();
