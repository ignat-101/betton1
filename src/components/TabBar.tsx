import { useApp } from '../data';
import { TrendingUp, Plus, User, MessageSquare } from 'lucide-react';
import type { TabType } from '../types';

const tabs: { id: TabType; label: string; icon: typeof TrendingUp }[] = [
  { id: 'markets', label: 'Рынки', icon: TrendingUp },
  { id: 'create', label: 'Создать', icon: Plus },
  { id: 'disputes', label: 'Заработать', icon: MessageSquare },
  { id: 'profile', label: 'Профиль', icon: User },
];

export default function TabBar() {
  const { activeTab, setActiveTab, selectMarket, setShowAdmin } = useApp();

  const handleTab = (tab: TabType) => {
    setActiveTab(tab);
    selectMarket(null);
    if (tab !== 'markets') setShowAdmin(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass" style={{ borderTop: '1px solid var(--border-glass)' }}>
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTab(id)}
            className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-lg transition-colors ${
              activeTab === id
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <Icon size={20} strokeWidth={activeTab === id ? 2.2 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
