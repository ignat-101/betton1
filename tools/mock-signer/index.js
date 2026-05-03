const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/send', async (req, res) => {
  const { to, amount, payout_id } = req.body;
  
  if (!to || !amount || amount > 100) {
    return res.status(400).json({ error: 'Invalid amount (max 100 TON)' });
  }

  // Mock TX for Render demo (replace with real TON later)
  const tx_hash = `mock_${payout_id}_${Date.now()}`;
  
  console.log(`✅ Mock payout: ${amount}TON → ${to} #${payout_id}`);
  
  res.json({ 
    tx_hash,
    status: 'sent',
    explorer: 'https://testnet.tonscan.org/tx/' + tx_hash 
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ready' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 TON Signer ready: http://localhost:${port}/send`);
});

