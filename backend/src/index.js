require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { logger } = require('./services/logger');

// Route imports
const authRoutes = require('./routes/auth');
const publisherRoutes = require('./routes/publishers');
const adminRoutes = require('./routes/admins');
const logRoutes = require('./routes/logs');
const bidderRoutes = require('./routes/bidders');
const websiteRoutes = require('./routes/websites');
const statsRoutes = require('./routes/stats');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',   // admin panel (dev)
    'http://localhost:3001',   // publisher dashboard (dev)
    process.env.ADMIN_ORIGIN,
    process.env.PUBLISHER_ORIGIN,
  ].filter(Boolean),
  credentials: true,
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logging ─────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/publishers', publisherRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/bidders', bidderRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/test', testRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'pubvibe-backend',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── MongoDB + server start ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pubvibe')
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(PORT, () => logger.info(`PubVibe backend listening on port ${PORT}`));
  })
  .catch((err) => {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  });

module.exports = app;
