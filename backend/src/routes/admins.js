const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('superadmin'));

// GET /api/admins – list all admin users
router.get('/', async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admins – create admin
router.post('/',
  body('email').isEmail(),
  body('name').notEmpty(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['admin', 'superadmin']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, name, password, role } = req.body;
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ error: 'Email already in use' });

      const admin = await User.create({ name, email, password, role, createdBy: req.user._id });
      res.status(201).json(admin);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PATCH /api/admins/:id – update admin
router.patch('/:id', async (req, res) => {
  try {
    const admin = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admins/:id – deactivate admin
router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ error: 'Cannot deactivate yourself' });
  }
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Admin deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
