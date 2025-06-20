const mongoose = require("mongoose");
var mongooseDelete = require("mongoose-delete");

const flightSchema = new mongoose.Schema({
  airline: String,
  image: String,
  flightNumber: String,
  departure: String,
  destination: String,
  departureTime: Date,
  arrivalTime: Date,
  originalPrice: Number,    
  taxPrice: Number,         
  seatsAvailable: Number,
});

flightSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Flight", flightSchema);
