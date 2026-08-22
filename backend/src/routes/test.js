const router = require('express').Router();
const axios = require('axios');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin', 'superadmin'));

const ZONE_ID = '362093';
const ENDPOINTS = {
  useast: 'https://rtb-useast.trackifyy.com/rtb',
  uswest: 'https://rtb-uswest.trackifyy.com/rtb',
  eu:     'https://rtb-eu.trackifyy.com/rtb',
  apac:   'https://rtb-apac.trackifyy.com/rtb',
};

/**
 * Build a minimal oRTB 2.5 bid request for testing.
 */
function buildTestBidRequest(zoneId, publisherId) {
  return {
    id: `test-${Date.now()}`,
    imp: [{
      id: '1',
      banner: { w: 300, h: 250, format: [{ w: 300, h: 250 }, { w: 728, h: 90 }] },
      tagid: zoneId || ZONE_ID,
      bidfloor: 0.01,
      bidfloorcur: 'USD',
    }],
    site: {
      page: 'https://example.com/test',
      domain: 'example.com',
      publisher: { id: publisherId || 'test-pub-001' },
    },
    device: {
      ua: 'Mozilla/5.0 (test)',
      ip: '8.8.8.8',
      language: 'en',
    },
    user: { id: 'test-user-001' },
    at: 1,
    tmax: 1000,
    cur: ['USD'],
  };
}

// POST /api/test/bid  – fire a test bid request to a PubVibe endpoint
router.post('/bid', async (req, res) => {
  const { region = 'useast', zoneId, publisherId } = req.body;
  const endpoint = ENDPOINTS[region];
  if (!endpoint) return res.status(400).json({ error: 'Invalid region' });

  const bidRequest = buildTestBidRequest(zoneId || ZONE_ID, publisherId);
  const startTs = Date.now();

  try {
    const response = await axios.post(`${endpoint}?zone=${zoneId || ZONE_ID}`, bidRequest, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      timeout: 3000,
    });

    return res.json({
      success: true,
      region,
      endpoint,
      latencyMs: Date.now() - startTs,
      statusCode: response.status,
      bidResponse: response.data,
      sentRequest: bidRequest,
    });
  } catch (err) {
    return res.json({
      success: false,
      region,
      endpoint,
      latencyMs: Date.now() - startTs,
      error: err.message,
      statusCode: err.response?.status,
      sentRequest: bidRequest,
    });
  }
});

// POST /api/test/bid-all  – test all 4 regional endpoints in parallel
router.post('/bid-all', async (req, res) => {
  const { zoneId, publisherId } = req.body;
  const bidRequest = buildTestBidRequest(zoneId, publisherId);

  const results = await Promise.allSettled(
    Object.entries(ENDPOINTS).map(async ([region, endpoint]) => {
      const start = Date.now();
      try {
        const resp = await axios.post(`${endpoint}?zone=${zoneId || ZONE_ID}`, bidRequest, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 3000,
        });
        return { region, endpoint, success: true, latencyMs: Date.now() - start, statusCode: resp.status, bids: resp.data?.seatbid?.[0]?.bid?.length || 0 };
      } catch (e) {
        return { region, endpoint, success: false, latencyMs: Date.now() - start, error: e.message };
      }
    })
  );

  res.json({
    sentRequest: bidRequest,
    results: results.map(r => r.value || r.reason),
  });
});

module.exports = router;
