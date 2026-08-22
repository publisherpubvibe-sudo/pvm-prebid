const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Publisher = require('../models/Publisher');
const { authenticate, requireRole } = require('../middleware/auth');

// All publisher routes require login
router.use(authenticate);

// ── GET /api/publishers  (admin sees all; publisher sees own) ─────────────
router.get('/', async (req, res) => {
  try {
    let publishers;
    if (['admin', 'superadmin'].includes(req.user.role)) {
      publishers = await Publisher.find().populate('userId', 'name email lastLogin isActive');
    } else {
      publishers = await Publisher.find({ userId: req.user._id }).populate('userId', 'name email');
    }
    res.json(publishers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/publishers/:id ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const pub = await Publisher.findById(req.params.id).populate('userId', 'name email lastLogin');
    if (!pub) return res.status(404).json({ error: 'Publisher not found' });

    // Publishers can only see their own record
    if (req.user.role === 'publisher' && pub.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(pub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/publishers  (admin creates publisher account) ──────────────
router.post('/',
  requireRole('admin', 'superadmin'),
  body('email').isEmail(),
  body('name').notEmpty(),
  body('password').isLength({ min: 8 }),
  body('companyName').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, name, password, companyName, revShare } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(409).json({ error: 'Email already exists' });

      const user = await User.create({ name, email, password, role: 'publisher', createdBy: req.user._id });
      const publisher = await Publisher.create({
        userId: user._id,
        companyName,
        revShare: revShare || 70,
      });

      res.status(201).json({ user, publisher });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PATCH /api/publishers/:id  (admin updates publisher) ─────────────────
router.patch('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const pub = await Publisher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pub) return res.status(404).json({ error: 'Publisher not found' });
    res.json(pub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/publishers/:id  (deactivate) ────────────────────────────
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const pub = await Publisher.findById(req.params.id);
    if (!pub) return res.status(404).json({ error: 'Publisher not found' });
    await User.findByIdAndUpdate(pub.userId, { isActive: false });
    pub.isActive = false;
    await pub.save();
    res.json({ message: 'Publisher deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/publishers/:id/websites  (add website) ─────────────────────
router.post('/:id/websites',
  body('domain').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pub = await Publisher.findById(req.params.id);
      if (!pub) return res.status(404).json({ error: 'Not found' });

      // Allow publisher to manage their own sites
      if (req.user.role === 'publisher' && pub.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      pub.websites.push({ domain: req.body.domain, name: req.body.name });
      await pub.save();
      res.status(201).json(pub.websites);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/publishers/:id/adunits  (add ad unit) ──────────────────────
router.post('/:id/adunits',
  body('name').notEmpty(),
  body('divId').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pub = await Publisher.findById(req.params.id);
      if (!pub) return res.status(404).json({ error: 'Not found' });

      if (req.user.role === 'publisher' && pub.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      pub.adUnits.push(req.body);
      await pub.save();
      res.status(201).json(pub.adUnits);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
