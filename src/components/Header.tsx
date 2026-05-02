import { useApp } from '../data';
import { Settings, Shield } from 'lucide-react';

export default function Header() {
  const { user, showAdmin, setShowAdmin, selectMarket, setActiveTab, connectWallet, disconnectWallet } = useApp();
  const isAdmin = user.address === 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';

  const short = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : '';

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
          <span className="text-base font-semibold text-white tracking-tight">betton</span>
        </button>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => { setShowAdmin(!showAdmin); selectMarket(null); }}
              className={`p-2 rounded-lg transition-colors ${showAdmin ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Shield size={18} />
            </button>
          )}

          <div className="flex items-center gap-3">
            {user.address ? (
              <>
                <div className="text-sm text-gray-200">{short(user.address)}</div>
                <button onClick={disconnectWallet} className="px-3 py-1 bg-red-600/20 rounded-lg text-sm">Disconnect</button>
              </>
            ) : (
              <button onClick={connectWallet} className="px-3 py-1 bg-green-600/20 rounded-lg text-sm">Connect Wallet</button>
            )}
          </div>

          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
