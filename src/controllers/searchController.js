const Hotel = require("../models/Hotel");
const Flight = require("../models/Flight");
const { removeVietnameseTones } = require("../util/textUtils");

class searchController {
  async searchHotels(req, res) {
    try {
      const {
        minPrice,
        maxPrice,
        starRating,
        amenities,
        province,
        district,
        freeCancellation
      } = req.body;

      // Tìm tất cả hotel đang active và chưa bị xóa mềm
      const allHotels = await Hotel.find({ isActive: true, deleted: false });

      const normalizedProvince = removeVietnameseTones(province || "");
      const normalizedDistrict = removeVietnameseTones(district || "");

      const filtered = allHotels.filter(hotel => {
        // So sánh tỉnh/thành không dấu
        const matchProvince = province
          ? removeVietnameseTones(hotel.province || "").includes(normalizedProvince)
          : true;

        // So sánh quận/huyện không dấu
        const matchDistrict = district
          ? removeVietnameseTones(hotel.district || "").includes(normalizedDistrict)
          : true;

        // So sánh khoảng giá
        const matchPrice =
          (!minPrice || hotel.pricePerNight >= parseFloat(minPrice)) &&
          (!maxPrice || hotel.pricePerNight <= parseFloat(maxPrice));

        // So sánh sao
        const matchStar =
          Array.isArray(starRating) && starRating.length > 0
            ? starRating.map(Number).includes(hotel.starRating)
            : true;

        // So sánh tiện nghi
        const matchAmenities =
          Array.isArray(amenities) && amenities.length > 0
            ? amenities.every(a => hotel.amenities.includes(a))
            : true;

        // So sánh chính sách hủy miễn phí
        const matchCancellation =
          freeCancellation === true
            ? /miễn phí/i.test(hotel.policies?.cancellationPolicy || "")
            : true;

        return (
          matchProvince &&
          matchDistrict &&
          matchPrice &&
          matchStar &&
          matchAmenities &&
          matchCancellation
        );
      });

      res.json(filtered);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async searchFlights(req, res) {
    try {
      const {
        minPrice,
        maxPrice,
        airlines,
        departureTime,
        departure,   // điểm xuất phát
        destination, // điểm đến
      } = req.body;

      // Lấy tất cả chuyến bay
      const allFlights = await Flight.find();

      // Chuyển kiểu dữ liệu airlines về mảng nếu không phải
      const selectedAirlines = Array.isArray(airlines) ? airlines : [];

      const filteredFlights = allFlights.filter((flight) => {
        const finalPrice = (flight.originalPrice || 0) + (flight.taxPrice || 0);

        // Lọc giá vé
        const matchPrice =
          (!minPrice || finalPrice >= parseFloat(minPrice)) &&
          (!maxPrice || finalPrice <= parseFloat(maxPrice));

        // Lọc hãng bay
        const matchAirline =
          selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline);

        // Lọc giờ khởi hành
        const departureHour = new Date(flight.departureTime).getHours();
        let matchDepartureTime = true;

        if (departureTime === "morning") {
          matchDepartureTime = departureHour >= 5 && departureHour < 11;
        } else if (departureTime === "afternoon") {
          matchDepartureTime = departureHour >= 11 && departureHour < 17;
        } else if (departureTime === "evening") {
          matchDepartureTime = departureHour >= 17 && departureHour < 23;
        }

        // Chuẩn hóa chuỗi bằng removeVietnameseTones và chuyển về lowercase
        const flightDepartureNormalized = removeVietnameseTones(flight.departure.toLowerCase());
        const departureNormalized = departure ? removeVietnameseTones(departure.toLowerCase()) : "";

        const matchDeparture =
          !departure || flightDepartureNormalized.includes(departureNormalized);

        const flightDestinationNormalized = removeVietnameseTones(flight.destination.toLowerCase());
        const destinationNormalized = destination ? removeVietnameseTones(destination.toLowerCase()) : "";

        const matchDestination =
          !destination || flightDestinationNormalized.includes(destinationNormalized);

        return (
          matchPrice &&
          matchAirline &&
          matchDepartureTime &&
          matchDeparture &&
          matchDestination
        );
      });

      return res.json(filteredFlights);
    } catch (err) {
      return res.status(500).json({ message: "Lỗi tìm kiếm chuyến bay", error: err.message });
    }
  }
}

module.exports = new searchController();
