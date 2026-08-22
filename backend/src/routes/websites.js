const router = require('express').Router();
const Publisher = require('../models/Publisher');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/websites – admin sees all, publisher sees own
router.get('/', async (req, res) => {
  try {
    let publishers;
    if (['admin', 'superadmin'].includes(req.user.role)) {
      publishers = await Publisher.find({}, 'publisherId companyName websites').lean();
    } else {
      publishers = await Publisher.find({ userId: req.user._id }, 'publisherId companyName websites').lean();
    }
    const sites = publishers.flatMap(p =>
      p.websites.map(w => ({ ...w, publisherId: p.publisherId, publisher: p.companyName }))
    );
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/websites/:pubId/:siteId/approve  (admin only)
router.patch('/:pubId/:siteId/approve', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const pub = await Publisher.findOne({ publisherId: req.params.pubId });
    if (!pub) return res.status(404).json({ error: 'Publisher not found' });

    const site = pub.websites.id(req.params.siteId);
    if (!site) return res.status(404).json({ error: 'Website not found' });

    site.isApproved = true;
    await pub.save();
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/websites/:pubId/:siteId
router.delete('/:pubId/:siteId', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const pub = await Publisher.findOne({ publisherId: req.params.pubId });
    if (!pub) return res.status(404).json({ error: 'Publisher not found' });
    pub.websites.pull({ _id: req.params.siteId });
    await pub.save();
    res.json({ message: 'Website removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
