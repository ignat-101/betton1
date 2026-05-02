const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Simple mock verifier: if tx_hash starts with 'mocktx_' it's considered valid and amount 1.0
app.post('/verify', (req, res) => {
  const { tx_hash } = req.body || {};
  console.log('verify request', { tx_hash });
  if (!tx_hash) return res.json({ valid: false });
  if (tx_hash.startsWith('mocktx_')) {
    return res.json({ valid: true, to: process.env.TREASURY_WALLET || 'treasury', amount: 1.0 });
  }
  // for all other hashes respond valid:false
  res.json({ valid: false });
});

app.listen(3002, () => console.log('Mock verifier running on http://localhost:3002'));
