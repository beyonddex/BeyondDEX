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
    // Create date range: today to 7 days from now
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const from = today.toISOString().split('T')[0];
    const to = nextWeek.toISOString().split('T')[0];

    const response = await axios.get('https://financialmodelingprep.com/stable/economic_calendar', {
      params: {
        from,
        to,
        apikey: FMP_API_KEY
      }
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error('❌ Error fetching economic calendar:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

module.exports = router;
