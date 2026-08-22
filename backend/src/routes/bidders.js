const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

const PUBVIBE_ENDPOINTS = {
  useast: 'https://rtb-useast.trackifyy.com/rtb',
  uswest: 'https://rtb-uswest.trackifyy.com/rtb',
  eu:     'https://rtb-eu.trackifyy.com/rtb',
  apac:   'https://rtb-apac.trackifyy.com/rtb',
};

// GET /api/bidders/pubvibe/endpoints – list regional endpoints
router.get('/pubvibe/endpoints', (req, res) => {
  res.json(PUBVIBE_ENDPOINTS);
});

// GET /api/bidders – return all configured bidders
router.get('/', requireRole('admin', 'superadmin'), (req, res) => {
  res.json({
    pubvibe: {
      name: 'PubVibe SSP',
      endpoints: PUBVIBE_ENDPOINTS,
      defaultRegion: 'useast',
      mediaTypes: ['banner', 'video', 'native'],
      params: { zoneId: 'required', pubId: 'required', region: 'optional' },
    },
    appnexus: { name: 'AppNexus', endpoint: 'http://ib.adnxs.com/openrtb2' },
    rubicon:  { name: 'Rubicon Project', endpoint: 'http://exapi-us-east.rubiconproject.com/a/api/exchange.json' },
    openx:    { name: 'OpenX', endpoint: 'http://rtb.openx.net/v2/prebid' },
  });
});

module.exports = router;
