const cron = require("node-cron");
const Order = require("../models/Order");
const Room = require("../models/Room"); // Import model Room
const { getIO } = require("../config/socket");

const updateOrderStatus = () => {
  // Chạy cron job mỗi phút để kiểm tra trạng thái đơn hàng
  cron.schedule("* * * * *", async () => {
    console.log("Running order status update job...");

    const now = new Date();

    try {
      // Tìm các đơn hàng ở trạng thái Reserved quá 24 giờ
      const reservedOrders = await Order.find({
        status: "Reserved",
        bookingDate: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      });

      for (const order of reservedOrders) {
        order.status = "Cancelled";
        await order.save();

        // Hoàn lại số phòng
        const room = await Room.findById(order.serviceId);
        if (room) {
          room.quantity += order.quantity; // Hoàn lại số phòng
          await room.save();
        }

        // Gửi thông báo qua socket
        const io = getIO();
        io.emit("orderStatusChanged", {
          orderId: order._id,
          newStatus: "Cancelled",
          userId: order.user,
          message: `Đơn hàng #${order._id} đã bị hủy do quá thời gian giữ chỗ.`,
        });

        console.log(`Order #${order._id} status updated to Cancelled.`);
      }

      // Tìm các đơn hàng ở trạng thái Paid quá 1 giờ
      const paidOrders = await Order.find({
        status: "Paid",
        bookingDate: { $lte: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
      });

      for (const order of paidOrders) {
        order.status = "Completed";
        await order.save();

        // Gửi thông báo qua socket
        const io = getIO();
        io.emit("orderStatusChanged", {
          orderId: order._id,
          newStatus: "Completed",
          userId: order.user,
          message: `Đơn hàng #${order._id} đã hoàn tất.`,
        });

        console.log(`Order #${order._id} status updated to Completed.`);
      }
    } catch (error) {
      console.error("Error during order status update job:", error.message);
    }
  });
};

module.exports = updateOrderStatus;
