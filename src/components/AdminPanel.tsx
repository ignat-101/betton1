import { useApp } from '../data';
import { Shield, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useState } from 'react';

export default function AdminPanel() {
  const { markets, resolveMarket, user } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isAdmin = user.address === 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';
  
  if (!isAdmin) return null;

  const activeMarkets = markets.filter(m => m.status === 'active');
  const votingMarkets = markets.filter(m => m.status === 'voting');
  const resolvedMarkets = markets.filter(m => m.status === 'resolved');

  const MarketRow = ({ market }: { market: typeof markets[0] }) => (
    <div className="glass rounded-xl p-3 mb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-medium text-white leading-snug line-clamp-1">{market.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-600">от {market.creatorName}</span>
            <span className="text-[10px] text-gray-600">·</span>
            <span className="text-[10px] text-gray-600">Объём: ${market.totalVolume.toLocaleString()}</span>
            {market.voters.length > 0 && (
              <>
                <span className="text-[10px] text-gray-600">·</span>
                <span className="text-[10px] text-purple-400">{market.voters.length} голосов</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Voter breakdown */}
      {selectedId === market.id && market.voters.length > 0 && (
        <div className="mt-2 p-2 rounded-lg bg-white/5 text-[10px] space-y-1 fade-in">
          <div className="text-gray-500 font-medium mb-1">Голоса:</div>
          {market.voters.map((v, i) => (
            <div key={i} className="flex justify-between text-gray-400">
              <span>{v.name}</span>
                <span className={v.vote === 'yes' ? 'text-green-400' : 'text-red-400'}>
                {v.vote === 'yes' ? 'Да' : 'Нет'} ({v.stake} USDT)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2">
        {market.voters.length > 0 && (
          <button
            onClick={() => setSelectedId(selectedId === market.id ? null : market.id)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white bg-white/5 transition-colors"
          >
            <Eye size={10} /> Голоса
          </button>
        )}
        {(market.status === 'active' || market.status === 'voting') && (
          <>
            <button
              onClick={() => resolveMarket(market.id, 'yes')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors"
            >
              <CheckCircle size={10} /> Да
            </button>
            <button
              onClick={() => resolveMarket(market.id, 'no')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <XCircle size={10} /> Нет
            </button>
          </>
        )}
        {market.status === 'resolved' && (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <CheckCircle size={10} /> Решён: {market.resolution === 'yes' ? 'Да' : 'Нет'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-4 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} className="text-purple-400" />
        <h1 className="text-lg font-semibold text-white">Админ-панель</h1>
      </div>

      {/* Voting markets - priority */}
      {votingMarkets.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-medium text-yellow-400 mb-2 uppercase tracking-wider">
            На голосовании ({votingMarkets.length})
          </h2>
          {votingMarkets.map(m => <MarketRow key={m.id} market={m} />)}
        </div>
      )}

      {/* Active markets */}
      <div className="mb-4">
        <h2 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
          Активные ({activeMarkets.length})
        </h2>
        {activeMarkets.map(m => <MarketRow key={m.id} market={m} />)}
        {activeMarkets.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-xs">Нет активных рынков</div>
        )}
      </div>

      {/* Resolved */}
      {resolvedMarkets.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Завершённые ({resolvedMarkets.length})
          </h2>
          {resolvedMarkets.map(m => <MarketRow key={m.id} market={m} />)}
        </div>
      )}
    </div>
  );
}
