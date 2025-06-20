const OrderFlight = require("../models/OrderFlight");
const Flight = require("../models/Flight");
const { getIO } = require("../config/socket");

class orderFlightController {
async updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("🟡 [updateStatus] ID:", id);
    console.log("🟡 [updateStatus] New Status:", status);

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'processing'];
    if (!validStatuses.includes(status)) {
      console.warn("🔴 [updateStatus] Invalid status:", status);
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await OrderFlight.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user flight");

    if (!order) {
      console.warn("🔴 [updateStatus] Order not found with id:", id);
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("🟢 [updateStatus] Populated Order:", order);

    // Gửi thông báo real-time khi có yêu cầu hủy
    if (status === "processing") {
      const io = getIO();

      const userInfo = order.user
        ? (order.user.fullname || order.user.email || "Không xác định")
        : "Người dùng không tồn tại";

      const flightRoute = order.flight
        ? `${order.flight.departure} → ${order.flight.destination}`
        : "Chuyến bay không xác định";

      console.log("🔵 [updateStatus] Gửi thông báo Socket:");
      console.log("   - userInfo:", userInfo);
      console.log("   - flightRoute:", flightRoute);

      io.emit("flightStatusChanged", {
        orderId: order._id,
        newStatus: status,
        userId: order.user?._id,
        message: `Yêu cầu hủy vé máy bay #${order._id} từ khách hàng ${userInfo}`,
        flightInfo: flightRoute
      });
    }

    // Nếu trạng thái là cancelled, hoàn trả ghế
    if (status === "cancelled") {
      console.log("🟠 [updateStatus] Trạng thái là 'cancelled', tìm flight để cộng ghế");
      const flight = await Flight.findById(order.flight?._id);
      if (flight) {
        flight.seatsAvailable += 1;
        await flight.save();
        console.log("✅ [updateStatus] Đã hoàn trả ghế. Ghế hiện tại:", flight.seatsAvailable);
      } else {
        console.warn("⚠️ [updateStatus] Không tìm thấy flight khi hủy");
      }
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("🔥 [updateStatus] Lỗi:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

  // Thêm phương thức phê duyệt hủy vé
  async approveCancelRequest(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderFlight.findById(id).populate("user flight");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn vé máy bay",
        });
      }

      if (order.status !== "processing") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể hủy vé đang ở trạng thái yêu cầu hủy",
        });
      }

      // Cập nhật trạng thái và hoàn trả ghế
      order.status = "cancelled";
      await order.save();

      const flight = await Flight.findById(order.flight._id);
      if (flight) {
        flight.seatsAvailable += 1;
        await flight.save();
      }

      res.json({
        success: true,
        message: "Đã hủy vé máy bay thành công",
        data: order,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  // Create a new flight order
  async create(req, res) {
    try {
      // Verify flight exists
      const flight = await Flight.findById(req.body.flight);
      if (!flight) {
        return res.status(404).json({ message: "Flight not found" });
      }

      // Check seat availability
      if (flight.seatsAvailable < 1) {
        return res.status(400).json({ message: "No seats available" });
      }

      const order = new OrderFlight(req.body);
      await order.save();

      // Update available seats
      flight.seatsAvailable -= 1;
      await flight.save();

      res.status(201).json({ success: true, data: order  });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update flight order
  async update(req, res) {
    try {
      const order = await OrderFlight.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete flight order
  async delete(req, res) {
    try {
      const order = await OrderFlight.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Restore seat if order is being cancelled
      if (order.status !== 'cancelled') {
        const flight = await Flight.findById(order.flight);
        if (flight) {
          flight.seatsAvailable += 1;
          await flight.save();
        }
      }

      await OrderFlight.findByIdAndDelete(req.params.id);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get all flight orders for a user
  async getUserOrders(req, res) {
    try {
      const orders = await OrderFlight.find({ user: req.params.userId })
        .populate('flight')
        .sort({ createdAt: -1 });
      res.json(orders);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get order details
  async getOrder(req, res) {
    try {
      const order = await OrderFlight.findById(req.params.id).populate('flight');
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await OrderFlight.findByIdAndUpdate(
        req.params.id,
        { 
          paymentStatus: status,
          status: status === 'paid' ? 'confirmed' : 'pending'
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new orderFlightController();