const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const AuctionLog = require('../models/AuctionLog');
const { authenticate, requireRole } = require('../middleware/auth');
const Publisher = require('../models/Publisher');

router.use(authenticate);

// GET /api/logs/auction – query auction logs
router.get('/auction', async (req, res) => {
  try {
    const { publisherId, bidder, status, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Publishers can only see their own logs
    if (req.user.role === 'publisher') {
      const pub = await Publisher.findOne({ userId: req.user._id });
      if (!pub) return res.status(404).json({ error: 'Publisher record not found' });
      filter.publisherId = pub.publisherId;
    } else if (publisherId) {
      filter.publisherId = publisherId;
    }

    if (bidder) filter.bidder = bidder;
    if (status) filter.status = status;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuctionLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      AuctionLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/server – stream server log file tail (admin only)
router.get('/server', requireRole('admin', 'superadmin'), (req, res) => {
  const logFile = path.join(process.cwd(), 'logs', 'combined.log');
  const lines = parseInt(req.query.lines) || 200;

  if (!fs.existsSync(logFile)) {
    return res.json({ lines: [] });
  }

  const content = fs.readFileSync(logFile, 'utf8');
  const allLines = content.split('\n').filter(Boolean);
  const last = allLines.slice(-lines);
  res.json({ lines: last, total: allLines.length });
});

// GET /api/logs/errors – error log tail (admin only)
router.get('/errors', requireRole('admin', 'superadmin'), (req, res) => {
  const logFile = path.join(process.cwd(), 'logs', 'error.log');
  const lines = parseInt(req.query.lines) || 100;

  if (!fs.existsSync(logFile)) return res.json({ lines: [] });

  const content = fs.readFileSync(logFile, 'utf8');
  const allLines = content.split('\n').filter(Boolean);
  const last = allLines.slice(-lines);
  res.json({ lines: last, total: allLines.length });
});

// POST /api/logs/auction – ingest a log entry (called internally by proxy/adapter)
router.post('/auction', async (req, res) => {
  try {
    const log = await AuctionLog.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
