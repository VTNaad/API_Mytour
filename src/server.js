const fetch = require("node-fetch");
global.fetch = fetch; // Polyfill for Node.js < 18
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;
require("dotenv").config();
const express = require("express");
const http = require("http"); // Thêm module http
const router = require("./routes/api");
const connection = require("./config/database");
const cors = require("cors");
const sendReviewRequestForHotel = require("./middleware/sendReviewRequestForHotel");
const orderStatusCron = require("./middleware/orderStatusCron");
const { init: initSocket } = require("./config/socket"); // Import socket initialization

const app = express();
const port = process.env.PORT || 8080;

// Tạo HTTP server thay vì dùng trực tiếp express
const server = http.createServer(app);

// Khởi tạo WebSocket
const io = initSocket(server);

// Config CORS cho cả Express và Socket.IO
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware để truyền io instance đến các route nếu cần
app.use((req, res, next) => {
  req.io = io;
  next();
});

//config req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/v1/api/", router);

(async () => {
  try {
    await connection();
    sendReviewRequestForHotel();
    orderStatusCron();

    server.listen(port, () => {
      console.log(`Backend Nodejs App listening on port ${port}`);
      console.log(`WebSocket server ready on ws://localhost:${port}`);
    });
  } catch (error) {
    console.log(">>> Error connect to DB: ", error);
  }
})();
