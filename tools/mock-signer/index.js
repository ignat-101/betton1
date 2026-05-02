const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

app.post('/sign', (req, res) => {
  const { to, amount, payout_id } = req.body || {};
  console.log('Mock signer received', { to, amount, payout_id });
  // simulate signing and broadcasting
  const tx_hash = 'mocktx_' + crypto.randomBytes(8).toString('hex');
  // return tx_hash immediately
  res.json({ tx_hash });
});

app.listen(3001, () => console.log('Mock signer running on http://localhost:3001'));
