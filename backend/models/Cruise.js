const mongoose = require('mongoose');

const ItineraryItemSchema = new mongoose.Schema({
  day: Number,
  dayName: String,
  port: String,
  description: String,
  image: String
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
  itineraryMap: String,
  description: String,
  itinerary: [String],
  itineraryDetailed: [ItineraryItemSchema],
  cabins: [CabinSchema],
  gallery: [String]
}, { timestamps: true });

CruiseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});

// Optimization indexes
CruiseSchema.index({ continent: 1 });
CruiseSchema.index({ provider: 1 });
CruiseSchema.index({ price: 1 });
CruiseSchema.index({ departureDate: 1 });
CruiseSchema.index({ durationDays: 1 });
CruiseSchema.index({ name: 'text', description: 'text' });

// Ensure uniqueness per provider
CruiseSchema.index({ externalId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Cruise', CruiseSchema);
