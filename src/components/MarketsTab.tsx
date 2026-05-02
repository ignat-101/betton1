import { useApp } from '../data';
import MarketCard from './MarketCard';
import type { FilterType } from '../types';

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'crypto', label: 'Крипто' },
  { id: 'sports', label: 'Спорт' },
  { id: 'weather', label: 'Погода' },
  { id: 'other', label: 'Другое' },
];

export default function MarketsTab() {
  const { markets, filter, setFilter } = useApp();

  const filtered = filter === 'all'
    ? markets
    : markets.filter(m => m.category === filter);

  const activeMarkets = filtered.filter(m => m.status === 'active');
  const votingMarkets = filtered.filter(m => m.status === 'voting');
  const resolvedMarkets = filtered.filter(m => m.status === 'resolved');

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
      {/* Filters */}
      <div className="sticky top-0 z-10 px-4 py-3" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Voting Section */}
      {votingMarkets.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-xs font-medium text-yellow-400 mb-2 uppercase tracking-wider">
            На голосовании
          </h2>
          <div className="flex flex-col gap-2">
            {votingMarkets.map(m => <MarketCard key={m.id} market={m} />)}
          </div>
        </div>
      )}

      {/* Active Markets */}
      <div className="px-4">
        <h2 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
          Активные рынки
        </h2>
        <div className="flex flex-col gap-2">
          {activeMarkets.map(m => <MarketCard key={m.id} market={m} />)}
        </div>
        {activeMarkets.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            Нет активных рынков в этой категории
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolvedMarkets.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Завершённые
          </h2>
          <div className="flex flex-col gap-2">
            {resolvedMarkets.map(m => <MarketCard key={m.id} market={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}
