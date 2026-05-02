import { useApp } from '../data';
import { Settings, Shield } from 'lucide-react';

export default function Header() {
  const { user, showAdmin, setShowAdmin, selectMarket, setActiveTab } = useApp();
  const isAdmin = user.address === 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';

  return (
    <header className="sticky top-0 z-50 glass" style={{ borderBottom: '1px solid var(--border-glass)' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => { selectMarket(null); setShowAdmin(false); setActiveTab('markets'); }}
          className="flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">⚡</span>
          </div>
          <span className="text-base font-semibold text-white tracking-tight">FlashBet</span>
        </button>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={() => { setShowAdmin(!showAdmin); selectMarket(null); }}
              className={`p-2 rounded-lg transition-colors ${showAdmin ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Shield size={18} />
            </button>
          )}
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
