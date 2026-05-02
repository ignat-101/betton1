import { useState } from 'react';
import { useApp } from '../data';
import { ArrowLeft, Clock, Users, CheckCircle, AlertTriangle, Vote } from 'lucide-react';

export default function MarketDetail() {
  const { selectedMarket: market, selectMarket, placeBet, voteOnMarket } = useApp();
  const [betOutcome, setBetOutcome] = useState<'yes' | 'no'>('yes');
  const [betAmount, setBetAmount] = useState('');
  const [showVote, setShowVote] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  const [votePlaced, setVotePlaced] = useState(false);

  if (!market) return null;

  const yesProb = market.outcomes.yes.probability;
  const noProb = market.outcomes.no.probability;

  const handleBet = () => {
    const amount = Number(betAmount);
    if (!amount || amount <= 0) return;
    placeBet(market.id, betOutcome, amount);
    setBetPlaced(true);
    setTimeout(() => setBetPlaced(false), 2000);
    setBetAmount('');
  };

  const handleVote = (vote: 'yes' | 'no') => {
    voteOnMarket(market.id, vote);
    setVotePlaced(true);
    setTimeout(() => setVotePlaced(false), 2000);
    setShowVote(false);
  };

  const endDate = new Date(market.endDate);
  const timeLeft = () => {
    const diff = market.endDate - Date.now();
    if (diff <= 0) return 'Завершено';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return days > 0 ? `${days}д ${hours}ч` : `${hours}ч`;
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 slide-up">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-primary)' }}>
        <button onClick={() => selectMarket(null)} className="p-1 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-gray-400">Назад</span>
      </div>

      <div className="px-4 space-y-4">
        {/* Title & Meta */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 capitalize">
              {market.category}
            </span>
            <span className="text-[10px] text-gray-600">от {market.creatorName}</span>
          </div>
          <h1 className="text-lg font-semibold text-white leading-snug">{market.title}</h1>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{market.description}</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock size={12} /> {timeLeft()}</span>
          <span>Объём: ${market.totalVolume.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Users size={12} /> {market.voters.length}</span>
        </div>

        {/* Probability Display */}
        <div className="glass rounded-xl p-4 space-y-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Вероятности</div>
          
          {/* Yes bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-green-400">Да</span>
              <span className="text-lg font-bold text-white tabular-nums">{yesProb}%</span>
            </div>
            <div className="probability-bar" style={{ height: 6 }}>
              <div className="probability-fill" style={{ width: `${yesProb}%`, background: 'var(--accent-green)' }} />
            </div>
            <div className="text-[10px] text-gray-600 mt-1">Пул: ${market.outcomes.yes.pool.toLocaleString()}</div>
          </div>

          {/* No bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-red-400">Нет</span>
              <span className="text-lg font-bold text-white tabular-nums">{noProb}%</span>
            </div>
            <div className="probability-bar" style={{ height: 6 }}>
              <div className="probability-fill" style={{ width: `${noProb}%`, background: 'var(--accent-red)' }} />
            </div>
            <div className="text-[10px] text-gray-600 mt-1">Пул: ${market.outcomes.no.pool.toLocaleString()}</div>
          </div>
        </div>

        {/* Resolution info */}
        <div className="glass rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Разрешение спора</div>
          <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
            <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
            <span>
              Результат определяется через оракул (CoinGecko) + голосование валидаторов. 
              Валидаторы ставят репутацию и получают вознаграждение за правильные голоса.
            </span>
          </div>
          {market.oracleType === 'crypto' && (
            <div className="mt-2 text-[10px] text-gray-600">
              Оракул: CoinGecko ({market.oracleConfig})
            </div>
          )}
          <div className="mt-2 text-[10px] text-gray-600">
            Окончание: {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Voters */}
        {market.voters.length > 0 && (
          <div className="glass rounded-xl p-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              <Vote size={12} className="inline mr-1" />
              Голоса валидаторов ({market.voters.length})
            </div>
            <div className="space-y-2">
              {market.voters.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{v.stake} ⭐</span>
                    <span className={v.vote === 'yes' ? 'text-green-400' : 'text-red-400'}>
                      {v.vote === 'yes' ? 'Да' : 'Нет'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bet Placed Notification */}
        {betPlaced && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-400 text-sm fade-in">
            <CheckCircle size={16} />
            Ставка размещена!
          </div>
        )}

        {votePlaced && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 text-purple-400 text-sm fade-in">
            <CheckCircle size={16} />
            Голос принят!
          </div>
        )}

        {/* Bet Controls */}
        {market.status === 'active' && (
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Сделать ставку</div>
            
            {/* Outcome toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setBetOutcome('yes')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  betOutcome === 'yes'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-500 border border-transparent'
                }`}
              >
                Да · {yesProb}%
              </button>
              <button
                onClick={() => setBetOutcome('no')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  betOutcome === 'no'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/5 text-gray-500 border border-transparent'
                }`}
              >
                Нет · {noProb}%
              </button>
            </div>

            {/* Amount */}
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Сумма в звёздах ⭐"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
              {[50, 100, 250, 500].map(a => (
                <button
                  key={a}
                  onClick={() => setBetAmount(String(a))}
                  className="flex-1 py-1.5 rounded-lg text-[11px] text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {a} ⭐
                </button>
              ))}
            </div>

            <button
              onClick={handleBet}
              className="w-full py-3 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: betOutcome === 'yes' ? 'var(--accent-green)' : 'var(--accent-red)' }}
            >
              Поставить {betOutcome === 'yes' ? 'на Да' : 'на Нет'}
            </button>
          </div>
        )}

        {/* Vote Button (for active/voting markets) */}
        {(market.status === 'active' || market.status === 'voting') && (
          <div>
            {!showVote ? (
              <button
                onClick={() => setShowVote(true)}
                className="w-full py-3 rounded-lg text-sm font-medium bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors"
              >
                <Vote size={14} className="inline mr-1.5" />
                Голосовать как валидатор
              </button>
            ) : (
              <div className="glass rounded-xl p-4 space-y-3 fade-in">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Голосование за результат
                </div>
                <p className="text-[11px] text-gray-500">
                  Ставите 100 ⭐ на ваш голос. Правильный голос — вознаграждение.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote('yes')}
                    className="flex-1 py-3 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                  >
                    Да (результат)
                  </button>
                  <button
                    onClick={() => handleVote('no')}
                    className="flex-1 py-3 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Нет (результат)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resolved */}
        {market.status === 'resolved' && market.resolution && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 text-green-400">
            <CheckCircle size={20} />
            <div>
              <div className="text-sm font-medium">Рынок разрешён</div>
              <div className="text-xs text-green-400/70">Результат: {market.resolution === 'yes' ? 'Да' : 'Нет'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
