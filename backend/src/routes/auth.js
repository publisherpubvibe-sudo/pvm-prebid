const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../services/logger');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

// POST /api/auth/login
router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account deactivated' });
      }
      user.lastLogin = new Date();
      await user.save();

      const token = signToken(user);
      logger.info(`User ${user.email} logged in`);
      res.json({ token, user });
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/change-password
router.post('/change-password',
  authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  }
);

module.exports = router;
