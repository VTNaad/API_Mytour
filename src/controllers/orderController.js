const Order = require("../models/Order");
const Room = require("../models/Room");
const Cash = require("../models/Cash");
const OrderFlight = require("../models/OrderFlight");
const { getIO } = require("../config/socket");
const Transaction = require("../models/Transaction");

class OrderController {
  // [GET] /orders/count
  async getOrderCount(req, res) {
    try {
      const orderCount = await Order.countDocuments({
        status: { $ne: "Cancelled" },
      });
      const flightOrderCount = await OrderFlight.countDocuments({
        status: { $ne: "Cancelled" },
      });

      const totalOrders = orderCount + flightOrderCount;

      res.json({
        success: true,
        data: {
          orderCount: totalOrders,
          hotelOrders: orderCount,
          flightOrders: flightOrderCount,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async getAllOrder(req, res) {
    try {
      const orders = await Order.find()
        .populate("user")
        .populate("transactionId")
        .populate({
          path: "serviceId",
          model: "Room",
        });
      res.json({ success: true, data: orders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const orders = await Order.find({ user: userId }).populate("serviceId");
      res.json({ success: true, data: orders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const { id } = req.params; // Lấy orderId từ URL
      const order = await Order.findById(id)
        .populate("user")
        .populate("transactionId")
        .populate({
          path: "serviceId",
          model: "Room",
        });

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
      res.json({ success: true, data: order });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createOrder(req, res) {
    try {
      const {
        user,
        serviceType,
        serviceId,
        hotelName,
        roomName,
        quantity,
        originalPrice,
        commission,
        totalPrice,
        contactInfo,
        guestInfo,
        note,
        imageRoom,
        cashUsed = 0, // Thêm trường cashUsed, mặc định là 0
        status = "Paid", // Mặc định là Paid
      } = req.body;

      if (serviceType === "Hotel") {
        const room = await Room.findById(serviceId);
        if (!room) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy phòng",
          });
        }

        if (room.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: "Số lượng phòng không đủ",
          });
        }

        // Giảm số lượng phòng
        room.quantity -= quantity;
        await room.save();
      }

      // Trừ tiền từ ví Cash nếu có sử dụng
      if (cashUsed > 0) {
        const cash = await Cash.findOne({ user });
        if (!cash || cash.money < cashUsed) {
          return res.status(400).json({
            success: false,
            message: "Số dư ví Cash không đủ",
          });
        }

        cash.money -= cashUsed;
        await cash.save();
      }
      let latestTxn = null;
      if (status === "Paid") {
        latestTxn = await Transaction.findOne({
          orderId: { $exists: true },
          status: "success",
        }).sort({ createdAt: -1 });
      }
      const newOrder = new Order({
        user,
        serviceType,
        serviceId,
        hotelName,
        roomName,
        quantity,
        originalPrice,
        commission,
        netRevenue: originalPrice - commission,
        totalPrice,
        contactInfo,
        guestInfo,
        status: status || "Paid",
        note: note || "",
        imageRoom: imageRoom || "",
        cashUsed, // Lưu số tiền đã sử dụng từ Cash vào order
        transactionId: latestTxn ? latestTxn._id : null, // Lưu transactionId nếu có
      });
      await newOrder.save();

      // Xử lý cashback (phần này giữ nguyên nhưng thêm kiểm tra cashUsed)
      if (serviceType === "Hotel" && (!cashUsed || cashUsed < totalPrice)) {
        const room = await Room.findById(serviceId);
        if (room && room.cashback) {
          const cashbackValue = room.cashback * quantity;

          // Tìm hoặc tạo cash
          const cash = await Cash.findOne({ user });
          if (cash) {
            // Tính toán cashback dựa trên level
            let actualCashback = cashbackValue;
            switch (cash.level) {
              case "silver":
                actualCashback *= 1.1;
                break;
              case "gold":
                actualCashback *= 1.2;
                break;
              case "diamond":
                actualCashback *= 1.5;
                break;
            }

            cash.money += Math.round(actualCashback);
            cash.totalSpent += quantity;
            cash.updateLevel();
            await cash.save();
          } else {
            const newCash = new Cash({
              user,
              money: Math.round(cashbackValue),
              totalSpent: quantity,
            });
            newCash.updateLevel();
            await newCash.save();
          }
        }
      }

      res.status(201).json({ success: true, data: newOrder });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "Reserved",
        "Paid",
        "Completed",
        "Cancelled",
        "Refunded",
        "Processing",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      if (status === "Cancelled") {
        try {
          const order = await Order.findById(id);
          const room = await Room.findById(order.serviceId);
          if (room) {
            room.quantity += order.quantity; // Hoàn lại số phòng
            await room.save();
          }
        } catch (error) {
          return res
            .status(500)
            .json({ message: "Lỗi khi update phòng trống" });
        }
      }
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("user");

      // Gửi thông báo real-time
      console.log("Emitting orderStatusChanged event:", {
        orderId: updatedOrder._id,
        newStatus: status,
        userId: updatedOrder.user._id,
        message: `Yêu cầu hủy đơn #${updatedOrder._id} từ khách hàng ${
          updatedOrder.user.name || updatedOrder.user.email
        }`,
      });
      const io = getIO();
      io.emit("orderStatusChanged", {
        orderId: updatedOrder._id,
        newStatus: status,
        userId: updatedOrder.user._id,
        message: `Yêu cầu hủy đơn #${updatedOrder._id} từ khách hàng ${
          updatedOrder.user.name || updatedOrder.user.email
        }`,
      });

      res.json(updatedOrder);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      const { serviceType, status, user, serviceId, quantity, cashUsed } =
        order;

      // Nếu là đơn phòng khách sạn và đã thanh toán, hoàn trả số lượng phòng
      if (serviceType === "Hotel" && status === "Paid") {
        const room = await Room.findById(serviceId);
        if (room) {
          room.quantity += quantity;
          await room.save();
        }

        // Trừ lại số tiền cashback đã cộng vào (nếu có)
        const cash = await Cash.findOne({ user });
        if (cash && room?.cashback) {
          let cashbackValue = room.cashback * quantity;

          // Tính toán theo level lúc cộng (giả sử không thay đổi giữa lúc cộng & lúc xóa)
          let actualCashback = cashbackValue;
          switch (cash.level) {
            case "silver":
              actualCashback *= 1.1;
              break;
            case "gold":
              actualCashback *= 1.2;
              break;
            case "diamond":
              actualCashback *= 1.5;
              break;
          }

          cash.money -= Math.round(actualCashback);
          if (cash.money < 0) cash.money = 0;

          // Trừ số lần mua phòng ra khỏi totalSpent (giữ đồng bộ level)
          cash.totalSpent -= quantity;
          if (cash.totalSpent < 0) cash.totalSpent = 0;

          cash.updateLevel();
          await cash.save();
        }
      }

      // Xóa đơn hàng
      await Order.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Xóa đơn hàng thành công",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async approveCancelRequest(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id).populate("user");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      if (order.status !== "Processing") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể hủy đơn hàng đang ở trạng thái Processing",
        });
      }

      // Thu hồi cashback nếu đơn hàng là loại Hotel và đã thanh toán
      if (order.serviceType === "Hotel" && order.status === "Paid") {
        const cash = await Cash.findOne({ user: order.user._id });
        if (cash) {
          // Tìm thông tin phòng để lấy cashback rate
          const room = await Room.findById(order.serviceId);
          if (room && room.cashback) {
            let cashbackValue = room.cashback * order.quantity;

            // Tính toán cashback theo level (giống logic khi tạo order)
            let actualCashback = cashbackValue;
            switch (cash.level) {
              case "silver":
                actualCashback *= 1.1;
                break;
              case "gold":
                actualCashback *= 1.2;
                break;
              case "diamond":
                actualCashback *= 1.5;
                break;
            }

            // Trừ lại số tiền cashback đã cộng
            cash.money -= Math.round(actualCashback);
            if (cash.money < 0) cash.money = 0;

            // Giảm totalSpent để đồng bộ level
            cash.totalSpent -= order.quantity;
            if (cash.totalSpent < 0) cash.totalSpent = 0;

            // Cập nhật level
            cash.updateLevel();
            await cash.save();
          }
        }

        // Hoàn trả số lượng phòng nếu là đơn khách sạn
        const room = await Room.findById(order.serviceId);
        if (room) {
          room.quantity += order.quantity;
          await room.save();
        }
      }

      // Hoàn trả tiền từ cashUsed nếu có
      if (order.cashUsed > 0) {
        const cash = await Cash.findOne({ user: order.user._id });
        if (cash) {
          cash.money += order.cashUsed;
          await cash.save();
        }
      }

      // Cập nhật trạng thái
      order.status = "Cancelled";
      await order.save();

      res.json({
        success: true,
        message: "Đã hủy đơn hàng thành công",
        data: order,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRevenue(req, res) {
    try {
      // Đơn khách sạn có trạng thái Completed
      const completedHotelOrders = await Order.find({ status: "Completed" });

      // Đơn vé máy bay khác Cancelled
      const validFlightOrders = await OrderFlight.find({
        status: { $ne: "Cancelled" },
      });

      // Tính tổng doanh thu từ commission của khách sạn
      const hotelRevenue = completedHotelOrders.reduce((sum, order) => {
        return sum + (order.commission || 0);
      }, 0);

      // Tính tổng doanh thu từ 10% giá trị đơn bay
      const flightRevenue = validFlightOrders.reduce((sum, order) => {
        return sum + Math.round((order.totalPrice || 0) * 0.1);
      }, 0);

      const totalRevenue = hotelRevenue + flightRevenue;

      res.json({
        success: true,
        data: {
          totalRevenue,
          hotelRevenue,
          flightRevenue,
          completedOrdersCount: completedHotelOrders.length,
          validFlightOrdersCount: validFlightOrders.length,
        },
      });
    } catch (err) {
      console.error("Error calculating revenue:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRecentSixMonthsStatistics(req, res) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 2; // Lấy tháng hiện tại (1-12)
      const currentYear = now.getFullYear();

      let startMonth, startYear;

      // Nếu tháng hiện tại <= 6, cần lấy dữ liệu từ năm trước
      if (currentMonth <= 6) {
        startMonth = 12 - (6 - currentMonth); // Tính tháng bắt đầu từ năm trước
        startYear = currentYear - 1;
      } else {
        startMonth = currentMonth - 6; // Tính tháng bắt đầu từ năm hiện tại
        startYear = currentYear;
      }

      // Tìm tất cả các đơn hàng trong khoảng thời gian 6 tháng gần nhất
      const orders = await Order.find({
        status: { $in: ["Paid", "Completed"] }, // Chỉ lấy các đơn hàng đã thanh toán hoặc hoàn tất
        bookingDate: {
          $gte: new Date(`${startYear}-${startMonth}-01`), // Ngày đầu của tháng bắt đầu
          $lte: new Date(`${currentYear}-${currentMonth - 1}-31`), // Ngày cuối của tháng trước
        },
      });

      const flights = await OrderFlight.find({
        status: { $in: ["pending", "paid", "confirmed"] }, // Chỉ lấy các đơn hàng đã thanh toán hoặc xác nhận
        createdAt: {
          $gte: new Date(`${startYear}-${startMonth}-01`), // Ngày đầu của tháng bắt đầu
          $lte: new Date(`${currentYear}-${currentMonth}-01`), // Ngày cuối của tháng trước
        },
      });

      // Tạo thống kê theo từng tháng
      const monthlyStatistics = [];
      for (let i = 0; i < 6; i++) {
        const month = (startMonth + i) % 12 || 12; // Tính tháng (1-12)
        const year = startYear + Math.floor((startMonth + i - 1) / 12); // Tính năm
        monthlyStatistics.push({
          month,
          year,
          totalPricePaid: 0,
          hotelIncome: 0,
          flightIncome: 0,
        });
      }

      orders.forEach((order) => {
        const orderDate = new Date(order.bookingDate);
        const orderMonth = orderDate.getMonth() + 1;
        const orderYear = orderDate.getFullYear();

        const stat = monthlyStatistics.find(
          (item) => item.month === orderMonth && item.year === orderYear
        );

        if (stat) {
          stat.totalPricePaid += order.totalPrice || 0;
          stat.hotelIncome += order.commission || 0;
        }
      });
      flights.forEach((flight) => {
        const flightDate = new Date(flight.createdAt);
        const flightMonth = flightDate.getMonth() + 1;
        const flightYear = flightDate.getFullYear();

        const stat = monthlyStatistics.find(
          (item) => item.month === flightMonth && item.year === flightYear
        );

        if (stat) {
          stat.flightIncome += Math.round(flight.totalPrice * 0.1); // Tính 10% của totalPrice từ OrderFlight
        }
      });

      res.json({
        success: true,
        data: monthlyStatistics,
      });
    } catch (err) {
      console.error("Error calculating recent six months statistics:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
module.exports = new OrderController();
