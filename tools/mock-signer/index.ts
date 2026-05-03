import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { TonClient, WalletContractV4, beginCell } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const RPC_ENDPOINT = process.env.TON_RPC || 'https://testnet.toncenter.com/api/v2/jsonRPC';
const PRIVATE_KEY = process.env.TOOLS_MOCK_SIGNER_PRIVATE_KEY!;
const API_KEY = process.env.TON_API_KEY!;

let client: TonClient;
let walletContract: WalletContractV4;
let keyPair: Awaited<ReturnType<typeof mnemonicToPrivateKey>>;

async function initWallet() {
  client = new TonClient({
    endpoint: RPC_ENDPOINT,
    apiKey: API_KEY
  });

  keyPair = await mnemonicToPrivateKey(PRIVATE_KEY.split(' '));
  walletContract = WalletContractV4.create({ 
    workchain: 0, 
    publicKey: keyPair.publicKey 
  });
  
  console.log('✅ Signer wallet:', walletContract.address.toString());
  console.log('💰 Balance:', (await client.getBalance(walletContract.address)).toString());
}

app.post('/send', async (req: Request, res: Response) => {
  const { to, amount, payout_id } = req.body;
  
  if (!to || !amount || amount > 100) {
    return res.status(400).json({ error: 'Invalid amount (max 100 TON)' });
  }

  try {
    const nanoAmount = BigInt(Math.floor(amount * 1e9));
    
    const walletOpened = client.open(walletContract);
    const seqno = await walletOpened.getSeqno();
    
    const transferBody = beginCell().storeStringTail(`betton payout #${payout_id}`).endCell();
    
    await walletContract.sendTransfer(client, {
      seqno,
      secretKey: keyPair.secretKey,
      messages: [ {
        address: to,
        amount: nanoAmount,
        payload: transferBody,
      }],
    });

    console.log(`✅ Payout sent: #${payout_id} → ${to} ${amount}TON`);
    console.log(`Tx: https://testnet.tonscan.org/tx/${result}`);
    
    res.json({ 
      tx_hash: result,
      status: 'sent' 
    });
  } catch (error: any) {
    console.error('❌ Send error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

initWallet().then(() => {
  app.listen(3001, () => {
    console.log('🚀 Real TON Signer: http://localhost:3001/send');
    console.log('⚠️  PRIVATE KEY в .env - НИКОМУ НЕ ДАВАЙ!');
  });
}).catch(console.error);

