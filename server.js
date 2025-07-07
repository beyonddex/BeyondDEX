const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// ✅ Register your new calendar route
app.use('/api/calendar', require('./api/calendar'));

app.use('/api', require('./api/market-data'));

// Serve static files (for frontend)
app.use(express.static(__dirname));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});