const mongoose = require('mongoose');

const AuctionLogSchema = new mongoose.Schema({
  requestId: { type: String, index: true },
  publisherId: { type: String, index: true },
  domain: { type: String },
  adUnitCode: { type: String },
  bidder: { type: String },
  region: { type: String },
  status: {
    type: String,
    enum: ['bid', 'nobid', 'timeout', 'error'],
    index: true,
  },
  cpm: { type: Number, default: 0 },
  responseTimeMs: { type: Number },
  errorMessage: { type: String },
  rawRequest: { type: Object },    // full oRTB request (optional, for debug)
  rawResponse: { type: Object },   // full oRTB response (optional)
  timestamp: { type: Date, default: Date.now, index: true },
}, {
  // Keep 30 days of logs automatically (TTL index)
  expireAfterSeconds: 60 * 60 * 24 * 30,
  timeseries: {
    timeField: 'timestamp',
    metaField: 'publisherId',
    granularity: 'minutes',
  },
});

module.exports = mongoose.model('AuctionLog', AuctionLogSchema);
