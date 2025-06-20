// const Flight = require("../models/Flight");

// class FlightController {
//   async createFlight(req, res) {
//     const flight = new Flight(req.body);
//     await flight.save();
//     res.json(flight);
//   }
//   async updateFlight(req, res) {
//     const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });
//     res.json(flight);
//   }
//   async deleteFlight(req, res) {
//     await Flight.findByIdAndDelete(req.params.id);
//     res.json({ message: "Flight deleted" });
//   }
// }
// module.exports = new FlightController();
const Flight = require("../models/Flight");
const { removeVietnameseTones } = require("../util/textUtils");
const { imageUpload } = require("../config/cloudinary");

class FlightController {
  // Tạo chuyến bay
  async createFlight(req, res) {
    try {
      imageUpload.single("image")(req, res, async (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error uploading image",
            error: err.message,
          });
        }

        // Nếu có file ảnh, lưu URL vào req.body
        if (req.file && req.file.path) {
          req.body.image = req.file.path; // URL ảnh trên Cloudinary
        }
        const flight = new Flight(req.body);
        await flight.save();
        res.status(201).json(flight);
      });
    } catch (err) {
      res.status(500).json({ message: "Lỗi tạo chuyến bay", error: err });
    }
  }

  // Cập nhật chuyến bay
  async updateFlight(req, res) {
    try {
      imageUpload.single("image")(req, res, async (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error uploading image",
            error: err.message,
          });
        }

        // Nếu có file ảnh, lưu URL vào req.body
        if (req.file && req.file.path) {
          req.body.image = req.file.path; // URL ảnh trên Cloudinary
        }

        const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
        });
        if (!flight) {
          return res.status(404).json({ message: "Không tìm thấy chuyến bay" });
        }
        res.status(200).json({ success: true, data: flight });
      });
    } catch (err) {
      res.status(500).json({ message: "Lỗi cập nhật " + err, error: err });
    }
  }

  // Xóa chuyến bay
  async deleteFlight(req, res) {
    try {
      const flight = await Flight.findByIdAndDelete(req.params.id);
      if (!flight) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy chuyến bay để xóa" });
      }
      res.json({ message: "Đã xóa chuyến bay" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi xóa chuyến bay", error: err });
    }
  }

  // Lấy danh sách chuyến bay (thêm hàm này nếu cần hiển thị frontend)
  async getFlights(req, res) {
    try {
      const flights = await Flight.find({});
      res.json(flights);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Lỗi lấy danh sách chuyến bay", error: err });
    }
  }

  async getFlightById(req, res) {
    try {
      const flight = await Flight.findById(req.params.id);
      if (!flight) {
        return res.status(404).json({ message: "Không tìm thấy chuyến bay" });
      }
      res.json(flight);
    } catch (err) {
      res.status(500).json({ message: "Lỗi truy vấn chuyến bay", error: err });
    }
  }

  // Thêm vào trong class FlightController
  async searchFlights(req, res) {
    try {
      const { departure, destination, minTax, maxTax } = req.body;

      // Lấy toàn bộ chuyến bay
      const flights = await Flight.find();

      const normalizedDeparture = removeVietnameseTones(departure || "");
      const normalizedDestination = removeVietnameseTones(destination || "");

      // Lọc thủ công
      const filtered = flights.filter((flight) => {
        const matchDeparture = departure
          ? removeVietnameseTones(flight.departure || "").includes(
              normalizedDeparture
            )
          : true;

        const matchDestination = destination
          ? removeVietnameseTones(flight.destination || "").includes(
              normalizedDestination
            )
          : true;

        const matchTax =
          (!minTax || flight.taxPrice >= parseFloat(minTax)) &&
          (!maxTax || flight.taxPrice <= parseFloat(maxTax));

        return matchDeparture && matchDestination && matchTax;
      });

      res.json(filtered);
    } catch (err) {
      res.status(500).json({ message: "Lỗi tìm kiếm chuyến bay", error: err });
    }
  }

  async filterFlights(req, res) {
    try {
      const {
        departure,
        destination,
        minDepartureTime,
        maxArrivalTime,
        minPrice,
        maxPrice,
      } = req.query;

      const flights = await Flight.find();

      const normalizedDeparture = removeVietnameseTones(departure || "");
      const normalizedDestination = removeVietnameseTones(destination || "");

      const filtered = flights.filter((flight) => {
        const matchDeparture = departure
          ? removeVietnameseTones(flight.departure || "").includes(
              normalizedDeparture
            )
          : true;

        const matchDestination = destination
          ? removeVietnameseTones(flight.destination || "").includes(
              normalizedDestination
            )
          : true;

        const matchMinDepartureTime = minDepartureTime
          ? new Date(flight.departureTime).getTime() >=
            new Date(minDepartureTime).getTime()
          : true;

        const matchMaxArrivalTime = maxArrivalTime
          ? new Date(flight.arrivalTime).getTime() <=
            new Date(maxArrivalTime).getTime()
          : true;

        const matchMinPrice = minPrice
          ? flight.originalPrice >= parseFloat(minPrice)
          : true;

        const matchMaxPrice = maxPrice
          ? flight.originalPrice <= parseFloat(maxPrice)
          : true;

        return (
          matchDeparture &&
          matchDestination &&
          matchMinDepartureTime &&
          matchMaxArrivalTime &&
          matchMinPrice &&
          matchMaxPrice
        );
      });

      res.status(200).json(filtered);
    } catch (err) {
      console.error("Error filtering flights:", err);
      res.status(500).json({ message: err.message, error: err });
    }
  }
}

module.exports = new FlightController();
