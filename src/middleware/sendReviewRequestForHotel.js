const cron = require("node-cron");
const Order = require("../models/Order");
const User = require("../models/User");
const sendMail = require("../util/sendMail");

const sendReviewRequestForHotel = () => {
  const url_server = process.env.URL_SERVER;
  // Chạy cron mỗi ngày lúc 00:00
  cron.schedule("0 0 * * *", async () => {
    console.log("Running review request job for hotel...");

    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2); // Ngày hôm trước của ngày hôm qua
    twoDaysAgo.setHours(0, 0, 0, 0); // Bắt đầu ngày hôm trước của ngày hôm qua
    const endOfTwoDaysAgo = new Date(twoDaysAgo);
    endOfTwoDaysAgo.setHours(23, 59, 59, 999); // Kết thúc ngày hôm trước của ngày hôm qua

    try {
      // Tìm các order liên quan đến khách sạn có ngày đặt là ngày mai
      const orders = await Order.find({
        serviceType: "Hotel", // Chỉ lấy các order liên quan đến khách sạn
        bookingDate: {
          $gte: twoDaysAgo, // Bắt đầu ngày hôm trước của ngày hôm qua
          $lt: endOfTwoDaysAgo, // Kết thúc ngày hôm trước của ngày hôm qua
        },
      })
        .populate("user")
        .populate({
          path: "serviceId",
          model: "Room",
        });

      for (const order of orders) {
        const reviewLink = `${url_server}/hotelInfo?id=${order.serviceId.hotel}`;
        const email = order.user?.email;
        console.log(
          `Sending review request to ${email} for order ${order._id}...`
        );
        if (email) {
          const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Đánh giá dịch vụ</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  color: #333;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 20px auto;
                  padding: 20px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  background-color: #f9f9f9;
                }
                .header {
                  background-color: #4caf50;
                  color: #fff;
                  padding: 10px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                }
                .content {
                  padding: 20px;
                }
                .footer {
                  padding: 10px;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                }
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  margin-top: 20px;
                  background-color: #4caf50;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  font-size: 16px;
                }
                .button:hover {
                  background-color: #45a049;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Yêu cầu đánh giá dịch vụ</h2>
                </div>
                <div class="content">
                  <p>Chào bạn,</p>
                  <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Chúng tôi rất mong nhận được đánh giá của bạn để cải thiện chất lượng dịch vụ.</p>
                  <p>Vui lòng nhấn vào nút bên dưới để đánh giá:</p>
                  <a href="${reviewLink}" class="button">Đánh giá ngay</a>
                  <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
                </div>
                <div class="footer">
                  Trân trọng,<br>
                  Đội ngũ hỗ trợ của Mytour
                </div>
              </div>
            </body>
            </html>
          `;

          // Gửi email
          await sendMail.sendMailReviewHotel({
            email,
            html,
          });
        }
      }

      console.log("Review request job for hotel completed!");
    } catch (error) {
      console.error(
        "Error during review request job for hotel:",
        error.message
      );
      console.log("Error details:", error);
    }
  });
};

module.exports = sendReviewRequestForHotel;
