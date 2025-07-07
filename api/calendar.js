const express = require('express');
const router = express.Router();
const axios = require('axios');

const FMP_API_KEY = process.env.FMP_API_KEY;

router.get('/', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    const response = await axios.get('https://financialmodelingprep.com/api/v3/economic-calendar', {
      params: {
        from: today,
        to: today,
        apikey: FMP_API_KEY
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching calendar:', err.message);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

module.exports = router;
