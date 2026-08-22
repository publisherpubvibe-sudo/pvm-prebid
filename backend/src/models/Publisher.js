const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const WebsiteSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  name: { type: String },
  isApproved: { type: Boolean, default: false },
  adsTxt: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const AdUnitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  divId: { type: String, required: true },
  sizes: [{ type: [Number] }],         // e.g. [[300,250],[728,90]]
  zoneId: { type: String },            // PubVibe zone
  region: {
    type: String,
    enum: ['useast', 'uswest', 'eu', 'apac'],
    default: 'useast',
  },
  floorPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const PublisherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  publisherId: { type: String, default: () => `PUB-${uuidv4().slice(0, 8).toUpperCase()}`, unique: true },
  companyName: { type: String, required: true },
  websites: [WebsiteSchema],
  adUnits: [AdUnitSchema],
  revShare: { type: Number, default: 70, min: 0, max: 100 }, // percentage kept by publisher
  isActive: { type: Boolean, default: true },
  notes: { type: String },
  // Aggregated stats (updated by cron)
  totalRequests: { type: Number, default: 0 },
  totalImpressions: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Publisher', PublisherSchema);
