const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Read password from config file
const configPath = process.env.KTT_CONFIG_PATH;

if (!configPath) {
  console.error('KTT_CONFIG_PATH environment variable not set in .env.local');
  process.exit(1);
}

let PASSWORD = null;

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  PASSWORD = config.password;
  console.log('Password loaded from config file');
} catch (err) {
  console.error('Error reading config file:', err);
  process.exit(1);
}

// API endpoint to verify password
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (password === PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Serve React build
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Fallback to index.html for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});