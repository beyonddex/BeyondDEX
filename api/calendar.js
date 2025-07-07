const express = require('express');
const router = express.Router();
const axios = require('axios');

// Load API key from environment variables
const FMP_API_KEY = process.env.FMP_API_KEY;

// DEBUG LOGGING (remove for production)
if (!FMP_API_KEY) {
  console.warn('⚠️ [FMP_API_KEY Missing] Make sure .env is in the root and has: FMP_API_KEY=your_key_here');
} else {
  console.log('✅ FMP_API_KEY loaded:', FMP_API_KEY.slice(0, 6) + '...'); // show part of key for confirmation
}

router.get('/', async (req, res) => {
  try {
    // Calculate date range: today to 7 days from now
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const from = today.toISOString().split('T')[0];
    const to = nextWeek.toISOString().split('T')[0];

    console.log(`📅 Fetching calendar data from ${from} to ${to}`);

    const response = await axios.get('https://financialmodelingprep.com/stable/economic_calendar', {
      params: {
        from,
        to,
        apikey: FMP_API_KEY
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      console.warn('⚠️ API responded but no valid data returned:', response.data);
    } else {
      console.log(`✅ Received ${response.data.length} economic events`);
    }

    res.status(200).json(response.data);
  } catch (err) {
    console.error('❌ Error fetching economic calendar:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

module.exports = router;
