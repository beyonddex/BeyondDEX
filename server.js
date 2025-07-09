const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/calendar', require('./api/calendar'));
app.use('/api/market-data', require('./api/market-data')); // Uncomment if needed

// Serve frontend static files (e.g., index.html, CSS, JS)
app.use(express.static(__dirname));

// Optional: fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
