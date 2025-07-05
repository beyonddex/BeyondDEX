const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/api', require('./api/market-data'));

// Serve static files
app.use(express.static(__dirname));

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
