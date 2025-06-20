// utils/updateHotelMinPrice.js
const Room = require("../models/Room");
const Hotel = require("../models/Hotel");

const updateHotelMinPrice = async (hotelId) => {
  const rooms = await Room.find({ hotel: hotelId, deleted: false });
  if (!rooms || rooms.length === 0) return;

  const minPrice = Math.min(...rooms.map((r) => r.price));
  await Hotel.findByIdAndUpdate(hotelId, { pricePerNight: minPrice });
};

module.exports = updateHotelMinPrice;
