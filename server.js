const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch'); // Ensure this is installed: npm i node-fetch

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/api', require('./api/market-data'));

// ✅ Add proxy route for economic calendar
app.get('/api/calendar', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://financialmodelingprep.com/api/v3/economic-calendar?from=${today}&to=${today}&apikey=${process.env.FMP_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error('Calendar fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch economic calendar' });
  }
});

// ✅ Serve frontend static files
app.use(express.static(__dirname));

// ✅ Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});