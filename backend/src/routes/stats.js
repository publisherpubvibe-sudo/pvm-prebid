const router = require('express').Router();
const AuctionLog = require('../models/AuctionLog');
const Publisher = require('../models/Publisher');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/stats/overview – high-level numbers
router.get('/overview', async (req, res) => {
  try {
    let matchFilter = {};
    if (req.user.role === 'publisher') {
      const pub = await Publisher.findOne({ userId: req.user._id });
      if (!pub) return res.status(404).json({ error: 'Publisher not found' });
      matchFilter.publisherId = pub.publisherId;
    }

    const [totalReqs, wins, revenue, byBidder, byRegion] = await Promise.all([
      AuctionLog.countDocuments(matchFilter),
      AuctionLog.countDocuments({ ...matchFilter, status: 'bid' }),
      AuctionLog.aggregate([
        { $match: { ...matchFilter, status: 'bid' } },
        { $group: { _id: null, total: { $sum: '$cpm' } } },
      ]),
      AuctionLog.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$bidder', requests: { $sum: 1 }, wins: { $sum: { $cond: [{ $eq: ['$status', 'bid'] }, 1, 0] } } } },
        { $sort: { requests: -1 } },
      ]),
      AuctionLog.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$region', requests: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      totalRequests: totalReqs,
      totalWins: wins,
      winRate: totalReqs > 0 ? ((wins / totalReqs) * 100).toFixed(2) : 0,
      totalRevenue: revenue[0]?.total?.toFixed(4) || '0.0000',
      byBidder,
      byRegion,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/timeseries – hourly trend
router.get('/timeseries', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    let matchFilter = { timestamp: { $gte: since } };
    if (req.user.role === 'publisher') {
      const pub = await Publisher.findOne({ userId: req.user._id });
      if (pub) matchFilter.publisherId = pub.publisherId;
    }

    const data = await AuctionLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' },
          },
          requests: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$status', 'bid'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'bid'] }, '$cpm', 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
