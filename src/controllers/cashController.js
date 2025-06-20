const Cash = require("../models/Cash");
const User = require("../models/User");

class CashController {
  // Tạo cash mới cho user nếu chưa có
  async getOrCreateCash(req, res) {
    try {
      const { userId } = req.params;
      
      // Kiểm tra user có tồn tại không
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Tìm hoặc tạo cash
      let cash = await Cash.findOne({ user: userId });
      
      if (!cash) {
        cash = new Cash({ user: userId });
        await cash.save();
      }

      res.json({ success: true, data: cash });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Cập nhật số tiền trong cash
  async updateCash(req, res) {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      let cash = await Cash.findOne({ user: userId });
      
      if (!cash) {
        cash = new Cash({ user: userId });
      }

      cash.money += amount;
      if (cash.money < 0) {
        return res.status(400).json({ success: false, message: "Not enough money in cash" });
      }

      await cash.save();
      res.json({ success: true, data: cash });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Sử dụng tiền từ cash để thanh toán
  async useCashForPayment(req, res) {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      const cash = await Cash.findOne({ user: userId });
      
      if (!cash) {
        return res.status(404).json({ success: false, message: "Cash account not found" });
      }

      if (cash.money < amount) {
        return res.status(400).json({ 
          success: false, 
          message: `Not enough money in cash. Available: ${cash.money}` 
        });
      }

      cash.money -= amount;
      await cash.save();

      res.json({ 
        success: true, 
        data: cash,
        message: `Successfully used ${amount} from cash` 
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Thêm cashback vào tài khoản
  async addCashback(req, res) {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      const cash = await Cash.findOne({ user: userId });
      
      if (!cash) {
        return res.status(404).json({ success: false, message: "Cash account not found" });
      }

      // Tính toán cashback dựa trên level
      let cashbackAmount = amount;
      switch (cash.level) {
        case "silver":
          cashbackAmount *= 1.1; // +10%
          break;
        case "gold":
          cashbackAmount *= 1.2; // +20%
          break;
        case "diamond":
          cashbackAmount *= 1.5; // +50%
          break;
        // bronze giữ nguyên
      }

      cash.money += Math.round(cashbackAmount);
      await cash.save();

      res.json({ 
        success: true, 
        data: cash,
        message: `Added ${Math.round(cashbackAmount)} cashback to your account` 
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Cập nhật totalSpent (gọi sau khi thanh toán thành công)
  async updateTotalSpent(req, res) {
    try {
      const { userId } = req.params;
      const { amount } = req.body;

      const cash = await Cash.findOne({ user: userId });
      
      if (!cash) {
        return res.status(404).json({ success: false, message: "Cash account not found" });
      }

      cash.totalSpent += amount;
      cash.updateLevel(); // Cập nhật level nếu cần
      await cash.save();

      res.json({ success: true, data: cash });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Lấy thông tin cash
  async getCashInfo(req, res) {
    try {
      const { userId } = req.params;
      
      const cash = await Cash.findOne({ user: userId });
      
      if (!cash) {
        return res.status(404).json({ success: false, message: "Cash account not found" });
      }

      res.json({ success: true, data: cash });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CashController();