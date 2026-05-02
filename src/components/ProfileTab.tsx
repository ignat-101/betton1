import { useApp } from '../data';
import { Copy, Wallet, Star, TrendingUp, Users, Gift } from 'lucide-react';
import { useState } from 'react';
import { useEffect } from 'react';

export default function ProfileTab() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [treasury, setTreasury] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositTx, setDepositTx] = useState('');
  const [depositMsg, setDepositMsg] = useState('');
  const [depositCurrency, setDepositCurrency] = useState<'TON'|'USDT'>('TON');
  const [tonUsdPrice, setTonUsdPrice] = useState<number | null>(null);

  const copyRef = () => {
    navigator.clipboard?.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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

      {/* Info */}
      <div className="glass rounded-xl p-4">
        <div className="text-xs text-gray-500 leading-relaxed">
          <p className="mb-2">
            <strong className="text-gray-300">betton</strong> — моментальные ставки на любые события.
          </p>
          <p className="mb-2">
            Оплата в звёздах Telegram. Разрешение споров через оракулов и голосование валидаторов (Proof of Stake).
          </p>
          <p>
            Правильные голоса валидаторов вознаграждаются. Репутация влияет на вес голоса.
          </p>
        </div>
      </div>

      {/* Deposit */}
      <div className="glass rounded-xl p-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Пополнение баланса</span>
        </div>
        <div className="text-xs text-gray-400 mb-2">Отправьте TON или USDT на адрес казны и создайте заявку на зачисление, указав tx hash и сумму. TON будет конвертирован в USDT по текущему курсу.</div>
        <div className="mb-2">
          <div className="text-[10px] text-gray-500">Адрес казны</div>
          <div className="font-mono text-sm text-white break-words">{treasury || 'загрузка...'}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="number" value={depositAmount || ''} onChange={e => setDepositAmount(Number(e.target.value))} placeholder="Сумма" className="px-3 py-2 rounded-lg bg-neutral-900" />
          <select value={depositCurrency} onChange={e => setDepositCurrency(e.target.value as any)} className="px-3 py-2 rounded-lg bg-neutral-900">
            <option value="TON">TON</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="text" value={depositTx} onChange={e => setDepositTx(e.target.value)} placeholder="Tx hash (опционально)" className="px-3 py-2 rounded-lg bg-neutral-900 font-mono" />
          <div className="px-3 py-2 rounded-lg bg-neutral-900 text-sm text-gray-400">
            {depositCurrency === 'TON' && depositAmount > 0 ? (
              <span>≈ {tonUsdPrice ? (depositAmount * tonUsdPrice).toFixed(4) : '...'} USDT</span>
            ) : depositCurrency === 'USDT' ? (
              <span>{depositAmount} USDT</span>
            ) : <span>Выберите сумму</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => {
            if (!depositAmount || depositAmount <= 0) { setDepositMsg('Неверная сумма'); return; }
            const res = await fetch('/api/deposits/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_address: user.address, tx_hash: depositTx, amount: depositAmount, currency: depositCurrency }) });
            const j = await res.json();
            if (j.ok) { setDepositMsg('Заявка создана'); setDepositAmount(0); setDepositTx(''); } else { setDepositMsg(j.error || 'Ошибка'); }
          }} className="px-3 py-2 rounded-lg bg-green-600">Создать заявку</button>
          <button onClick={() => { navigator.clipboard?.writeText(treasury || ''); setDepositMsg('Скопировано'); }} className="px-3 py-2 rounded-lg bg-white/10">Скопировать адрес</button>
        </div>
        {depositMsg && <div className="text-xs text-green-400 mt-2">{depositMsg}</div>}
      </div>
    </div>
  );
}
