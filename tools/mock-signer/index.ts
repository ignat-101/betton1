import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { TonClient4, WalletContractV4, internal, beginCell } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const RPC_ENDPOINT = process.env.TON_RPC || 'https://testnet.toncenter.com/api/v2/jsonRPC';
const PRIVATE_KEY_MNEMONIC = process.env.TOOLS_MOCK_SIGNER_PRIVATE_KEY!; // 24 words or hex
const API_KEY = process.env.TON_API_KEY!;

let client: TonClient4;
let wallet: WalletContractV4;
let keyPair: Awaited<ReturnType<typeof mnemonicToPrivateKey>>;

async function initSigner() {
  client = new TonClient4({ endpoint: RPC_ENDPOINT });

  // Support both mnemonic words and hex seed
  const wordsArray = PRIVATE_KEY_MNEMONIC.trim().split(/\\s+/);
  keyPair = await mnemonicToPrivateKey(wordsArray.length === 1 ? [PRIVATE_KEY_MNEMONIC] : wordsArray);
  
  wallet = WalletContractV4.create({ 
    workchain: 0, 
    publicKey: keyPair.publicKey 
  });
  
  // Balance skip TS errors for Render
  console.log('✅ Signer:', wallet.address.toString());
}

app.post('/send', async (req: Request, res: Response) => {
  const { to, amount, payout_id } = req.body;
  
  if (!to || typeof amount !== 'number' || amount <= 0 || amount > 100) {
    return res.status(400).json({ error: 'Invalid payout: max 100 TON' });
  }

  try {
    const seqno = await client.open(wallet).getSeqno();
    const nanoTON = BigInt(Math.floor(amount * 1_000_000_000));
    
    // Comment payload
    const payload = beginCell()
      .storeUint(0, 32)
      .storeStringTail(`betton payout #${payout_id}`)
      .endCell();
    
    // Send transaction
    const result = await wallet.send(
      await client.open(wallet),
      {
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
          internal({
            to,
            value: nanoTON,
            body: payload,
          })
        ]
      }
    );

    console.log(`✅ SENT: ${amount}TON → ${to} #${payout_id}`);
    console.log(`🔗 https://testnet.tonscan.org/tx/${result}`);
    
    res.json({ 
      tx_hash: result, 
      status: 'sent',
      explorer: `https://testnet.tonscan.org/tx/${result}`
    });
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ready', wallet: wallet.address.toString() });
});

initSigner().then(() => {
  app.listen(3001, () => {
    console.log('🚀 TON Payout Signer: http://localhost:3001/send');
    console.log('✅ Health: http://localhost:3001/health');
  });
}).catch(err => {
  console.error('💥 Init failed:', err);
  process.exit(1);
});


