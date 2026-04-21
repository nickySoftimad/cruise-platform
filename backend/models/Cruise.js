const mongoose = require('mongoose');

const ItineraryItemSchema = new mongoose.Schema({
  day: Number,
  port: String,
  description: String
});

const CabinSchema = new mongoose.Schema({
  category: String,
  price: Number
});

const CruiseSchema = new mongoose.Schema({
  externalId: { type: String, required: true },
  provider: { type: String, required: true },
  name: { type: String, required: true },
  ship: String,
  destination: String,
  continent: String,
  departureDate: String,
  duration: String,
  durationDays: Number,
  price: Number,
  currency: { type: String, default: 'EUR' },
  image: String,
  description: String,
  itinerary: [String],
  itineraryDetailed: [ItineraryItemSchema],
  cabins: [CabinSchema],
  gallery: [String]
}, { timestamps: true });

// Ensure uniqueness per provider
CruiseSchema.index({ externalId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Cruise', CruiseSchema);
