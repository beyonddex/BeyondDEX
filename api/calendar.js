const express = require('express');
const router = express.Router();
const axios = require('axios');

// Load from environment or fallback (optional)
const FMP_API_KEY = process.env.FMP_API_KEY;

router.get('/', async (req, res) => {
  try {
    // Format today as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const response = await axios.get('https://financialmodelingprep.com/api/v3/economic-calendar', {
      params: {
        from: today,
        to: today,
        apikey: FMP_API_KEY
      }
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error('Error fetching economic calendar:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

module.exports = router;
