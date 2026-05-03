import { useApp } from '../data';
import { Copy, Wallet, Star, TrendingUp, Users, Gift, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useEffect } from 'react';

export default function ProfileTab() {
  const { user, connectWallet, refreshUser } = useApp();
  const [copied, setCopied] = useState(false);
  const [treasury, setTreasury] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositTx, setDepositTx] = useState('');
  const [depositMsg, setDepositMsg] = useState('');
  const [depositCurrency, setDepositCurrency] = useState<'TON'|'USDT'>('TON');
  const [tonUsdPrice, setTonUsdPrice] = useState<number | null>(null);
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const copyRef = useCallback(() => {
    navigator.clipboard?.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [user.referralCode]);

  const shortAddr = user.address.slice(0, 6) + '...' + user.address.slice(-4);
  const winRate = user.totalBets > 0 ? Math.round((user.wins / user.totalBets) * 100) : 0;

  useEffect(() => {
    fetch('/api/treasury_wallet').then(r => r.json()).then(j => setTreasury(j.treasury_wallet)).catch(() => {});
  }, []);

  useEffect(() => {
    if (depositCurrency === 'TON' && depositAmount > 0) {
      fetch('/api/oracle/price/the-open-network').then(r => r.json()).then(j => setTonUsdPrice(j['the-open-network']?.usd || null)).catch(() => setTonUsdPrice(null));
    } else setTonUsdPrice(null);
  }, [depositCurrency, depositAmount]);

  const autoDeposit = useCallback(async (tonAmount: number) => {
    if (!user.address || !treasury) {
      alert('Подключи кошелек!');
      connectWallet();
      return;
    }
    if (tonAmount > 100) {
      alert('Макс 100 TON/день');
      return;
    }

    setDepositStatus('pending');
    
    try {
      const mod = await import('@tonconnect/sdk');
      const { TonConnect } = mod as any;
      const ton = new TonConnect({
        manifestUrl: 'https://bet-ton.onrender.com/.well-known/ton-connect.json',
      });
      
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: treasury,
          amount: (tonAmount * 1e9).toString(),
          payload: `te6cckEBAQEAAgAAbetton:${user.address.slice(-8)}`
        }]
      };

      const result = await ton.sendTransaction(tx);
      console.log('Deposit TX:', result);
      
      setDepositStatus('success');
      setDepositMsg(`Депозит ${tonAmount} TON отправлен! ID: ${result}`);
      refreshUser();
      
    } catch (error) {
      console.error(error);
      setDepositStatus('error');
      setDepositMsg('Ошибка: ' + (error as Error).message);
    }
  }, [user.address, treasury, connectWallet, refreshUser]);

  const quickDeposits = [5, 10, 50];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-4 pt-4">
      {/* Wallet */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Wallet size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-[10px] text-gray-600 font-mono">{shortAddr}</div>
            </div>
          </div>
          {user.isAdmin && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
              Админ
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
          <Wallet size={16} className="text-white" />
          <div>
            <div className="text-xl font-bold text-white">{user.balance.toLocaleString()}</div>
            <div className="text-xs text-gray-500">USDT эквивалент (баланс)</div>
          </div>
        </div>
      </div>

      {/* Quick Deposit Buttons - NEW! */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpCircle size={18} className="text-green-400" />
          <span className="text-sm font-bold text-white">🚀 Быстрый депозит TON</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {quickDeposits.map((amt) => (
            <button
              key={amt}
              onClick={() => autoDeposit(amt)}
              disabled={depositStatus === 'pending' || !walletAddress}
              className="glass p-3 rounded-lg text-center hover:bg-green-500/20 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {amt} TON
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 text-center">
          Tonkeeper подпишет → Backend auto зачислит USDT! Max 100 TON/день
        </div>
        {depositStatus === 'success' && (
          <div className="mt-2 p-2 bg-green-500/20 rounded-lg text-xs text-green-400">
            {depositMsg}
          </div>
        )}
        {depositStatus === 'pending' && (
          <div className="mt-2 p-2 bg-blue-500/20 rounded-lg text-xs text-blue-400">
            Подписывай в Tonkeeper...
          </div>
        )}
        {depositStatus === 'error' && (
          <div className="mt-2 p-2 bg-red-500/20 rounded-lg text-xs text-red-400">
            {depositMsg}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Ставки</div>
          <div className="text-lg font-bold text-white">{user.totalBets}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Винрейт</div>
          <div className="text-lg font-bold text-white">{winRate}%</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Победы</div>
          <div className="text-lg font-bold text-green-400">{user.wins}</div>
        </div>
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Поражения</div>
          <div className="text-lg font-bold text-red-400">{user.losses}</div>
        </div>
      </div>

      {/* Reputation */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400">Репутация</span>
          <span className="text-sm font-bold text-white">{user.reputation}/100</span>
        </div>
        <div className="probability-bar" style={{ height: 6 }}>
          <div
            className="probability-fill"
            style={{
              width: `${user.reputation}%`,
              background: user.reputation > 70 ? 'var(--accent-green)' : user.reputation > 40 ? '#f59e0b' : 'var(--accent-red)',
            }}
          />
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5">
          Репутация влияет на вес вашего голоса при разрешении споров.
        </p>
      </div>

      {/* Referral */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={14} className="text-purple-400" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Реферальная программа</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-sm text-white font-mono">
            {user.referralCode}
          </div>
          <button
            onClick={copyRef}
            className="p-2 rounded-lg bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Copy size={14} />
          </button>
        </div>
        {copied && <div className="text-[10px] text-green-400 mb-2">Скопировано!</div>}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <Users size={12} className="text-gray-500 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{user.referrals}</div>
            <div className="text-[10px] text-gray-600">рефералов</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <TrendingUp size={12} className="text-gray-500 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{user.referralEarnings} USDT</div>
            <div className="text-[10px] text-gray-600">заработано</div>
          </div>
        </div>
      </div>

      {/* OLD Manual Deposit */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white opacity-60">Ручной депозит (старый)</span>
        </div>
        {/* ... old form ... */}
        <div className="text-xs text-gray-500 opacity-50">Используй кнопки выше! Авто и быстрее</div>
      </div>

      {/* Withdraw */}
      <div className="glass rounded-xl p-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownCircle size={18} className="text-orange-400" />
          <span className="text-sm font-bold text-white">💸 Вывод на кошелек</span>
        </div>
        <input 
          type="number" 
          placeholder="Сумма USDT" 
          className="w-full px-3 py-2 rounded-lg bg-neutral-900 mb-2" 
        />
        <button className="w-full p-3 bg-orange-600 rounded-lg font-bold hover:bg-orange-500 transition">
          Вывести
        </button>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Баланс списывается сразу, TON придет через signer
        </div>
      </div>
    </div>
  );
}
