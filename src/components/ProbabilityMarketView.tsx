import { useApp } from '../data';
import { ArrowLeft, TrendingUp, BarChart3 } from 'lucide-react';
import ProbabilityChart from './ProbabilityChart';

export default function ProbabilityMarketView() {
  const { selectedMarket, setShowProbabilityView } = useApp();

  if (!selectedMarket) return null;

  const market = selectedMarket;
  const history = (market as any).history || [];
  const yesProb = market.outcomes.yes.probability;
  const noProb = market.outcomes.no.probability;

  const endDate = new Date(market.endDate);
  const timeLeft = () => {
    const diff = market.endDate - Date.now();
    if (diff <= 0) return 'Завершено';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 slide-up">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-primary)' }}>
        <button onClick={() => setShowProbabilityView(false)} className="p-1 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-gray-400">Назад</span>
      </div>

      <div className="px-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-lg font-semibold text-white leading-snug">{market.title}</h1>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{market.description}</p>
        </div>

        {/* Time & Volume */}
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Осталось: {timeLeft()}</span>
          <span>Объём: ${market.totalVolume.toLocaleString()}</span>
        </div>

        {/* Probability Chart */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-blue-400" />
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">График вероятности</div>
          </div>
          <ProbabilityChart history={history} />
        </div>

        {/* Current Probabilities */}
        <div className="glass rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Текущие вероятности</div>
          
          {/* Yes */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-400">Да</span>
              <span className="text-2xl font-bold text-white">{yesProb}%</span>
            </div>
            <div className="probability-bar h-2">
              <div className="probability-fill" style={{ width: `${yesProb}%`, background: 'var(--accent-green)' }} />
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              Пул: ${market.outcomes.yes.pool.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* No */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-red-400">Нет</span>
              <span className="text-2xl font-bold text-white">{noProb}%</span>
            </div>
            <div className="probability-bar h-2">
              <div className="probability-fill" style={{ width: `${noProb}%`, background: 'var(--accent-red)' }} />
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              Пул: ${market.outcomes.no.pool.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* History Stats */}
        {history.length > 1 && (
          <div className="glass rounded-xl p-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">История</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-gray-600">Начало</div>
                <div className="text-sm font-semibold text-white">{history[0].yes || 50}%</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-600">Макс</div>
                <div className="text-sm font-semibold text-green-400">
                  {Math.max(...history.map(h => h.yes || 50))}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-600">Мин</div>
                <div className="text-sm font-semibold text-red-400">
                  {Math.min(...history.map(h => h.yes || 50))}%
                </div>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-2 text-center">
              Изменения за {history.length} точек времени
            </div>
          </div>
        )}

        {/* Info */}
        <div className="glass rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">О рынке</div>
          <div className="text-xs text-gray-500 leading-relaxed space-y-1">
            <p>✓ График показывает как менялась вероятность «Да» со временем</p>
            <p>✓ Большие объёмы ставок влияют на вероятности</p>
            <p>✓ Окончание {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
