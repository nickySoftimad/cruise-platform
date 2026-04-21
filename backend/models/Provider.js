const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['xml', 'csv'], default: 'xml' },
  url: String,
  rateUrl: String,
  itineraryUrl: String,
  enabled: { type: Boolean, default: true },
  lastSync: Date,
  count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Provider', ProviderSchema);
