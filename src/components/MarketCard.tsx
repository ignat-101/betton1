import type { Market } from '../types';
import { useApp } from '../data';
import { Clock } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  crypto: 'Крипто',
  sports: 'Спорт',
  politics: 'Политика',
  weather: 'Погода',
  other: 'Другое',
};

const categoryColors: Record<string, string> = {
  crypto: 'bg-blue-500/15 text-blue-400',
  sports: 'bg-green-500/15 text-green-400',
  politics: 'bg-orange-500/15 text-orange-400',
  weather: 'bg-cyan-500/15 text-cyan-400',
  other: 'bg-gray-500/15 text-gray-400',
};

function timeLeft(endDate: number): string {
  const diff = endDate - Date.now();
  if (diff <= 0) return 'Завершено';
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}д`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}ч`;
  return `${Math.floor(diff / 60000)}м`;
}

export default function MarketCard({ market }: { market: Market }) {
  const { selectMarket } = useApp();
  const yesProb = market.outcomes.yes.probability;

  return (
    <button
      onClick={() => selectMarket(market)}
      className="w-full text-left glass glass-hover rounded-xl p-4 transition-all duration-200 fade-in"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryColors[market.category] || categoryColors.other}`}>
              {categoryLabels[market.category] || market.category}
            </span>
            {market.status === 'voting' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                Голосование
              </span>
            )}
            {market.status === 'resolved' && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                Решён
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">
            {market.title}
          </h3>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-2xl font-bold text-white tabular-nums">
            {yesProb}¢
          </span>
        </div>
      </div>

      <div className="probability-bar mb-3">
        <div
          className="probability-fill"
          style={{
            width: `${yesProb}%`,
            background: `linear-gradient(90deg, ${yesProb > 50 ? 'var(--accent-green)' : 'var(--accent-blue)'}, ${yesProb > 50 ? '#00b876' : '#2563eb'})`,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          <span>Объём: ${market.totalVolume.toLocaleString()}</span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeLeft(market.endDate)}
          </span>
        </div>
        <span>Да {yesProb}% / Нет {market.outcomes.no.probability}%</span>
      </div>
    </button>
  );
}
