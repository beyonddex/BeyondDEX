const express = require('express');
const router = express.Router();
const axios = require('axios');

const FMP_API_KEY = process.env.FMP_API_KEY;

if (!FMP_API_KEY) {
  console.warn('⚠️ FMP_API_KEY is missing. Check your .env file.');
}

router.get('/', async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const from = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const to = nextWeek.toISOString().split('T')[0];

    const url = 'https://financialmodelingprep.com/api/v3/economic_calendar';
    console.log(`📅 Fetching events from ${from} to ${to}`);

    const response = await axios.get(url, {
      params: {
        from,
        to,
        apikey: FMP_API_KEY
      }
    });

    const events = response.data || [];
    console.log(`📊 Calendar returned ${events.length} event(s)`);

    res.status(200).json(events);
  } catch (err) {
    console.error('❌ Error fetching economic calendar:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

module.exports = router;
