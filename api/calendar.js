const express = require('express');
const router = express.Router();
const axios = require('axios');

const FMP_API_KEY = process.env.FMP_API_KEY;

// Debug only (remove in production)
if (!FMP_API_KEY) {
  console.warn('⚠️ FMP_API_KEY is missing. Check your .env file.');
}

router.get('/', async (req, res) => {
  try {
    const url = 'https://financialmodelingprep.com/api/v3/economic_calendar_today';
    console.log(`📅 Fetching today’s economic events from: ${url}`);

    const response = await axios.get(url, {
      params: {
        apikey: FMP_API_KEY
      }
    });

    const events = response.data;
    console.log(`📊 Calendar returned ${events.length} event(s)`);

    if (!events.length) {
      console.warn('⚠️ No events returned for today.');
    }

    res.status(200).json(events);
  } catch (err) {
    console.error('❌ Error fetching economic calendar:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

module.exports = router;
