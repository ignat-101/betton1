import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRef } from 'react';
import type { Market, UserProfile, TabType, FilterType, Voter } from './types';

const initialMarkets: Market[] = [];

const initialUser: UserProfile = {
  address: '',
  name: 'guest',
  balance: 0,
  reputation: 50,
  totalBets: 0,
  wins: 0,
  losses: 0,
  referralCode: '',
  referrals: 0,
  referralEarnings: 0,
  bets: [],
  isAdmin: false,
};

function mapBackendUserToProfile(u: any): UserProfile {
  if (!u) return initialUser;
  return {
    address: u.address || u.addr || '',
    name: u.name || 'anonymous',
    balance: Number(u.balance || 0),
    reputation: Number(u.reputation || 50),
    totalBets: Number(u.total_bets ?? u.totalBets ?? 0),
    wins: Number(u.wins ?? 0),
    losses: Number(u.losses ?? 0),
    referralCode: u.referralCode || u.referral_code || '',
    referrals: Number(u.referrals ?? 0),
    referralEarnings: Number(u.referralEarnings ?? u.referral_earnings ?? 0),
    bets: u.bets || [],
    isAdmin: Boolean(u.is_admin || u.isAdmin),
  };
}

function mapBackendMarketToMarket(m: any): Market {
  const outcomesRaw = m.outcomes || m['outcomes'] || {
    yes: { label: 'Да', probability: 50, pool: 0 },
    no: { label: 'Нет', probability: 50, pool: 0 },
  };
  const yes = outcomesRaw.yes || outcomesRaw['yes'] || { label: 'Да', probability: 50, pool: 0 };
  const no = outcomesRaw.no || outcomesRaw['no'] || { label: 'Нет', probability: 50, pool: 0 };
  return {
    id: m.id || m['id'] || String(Date.now()),
    title: m.title || m['title'] || '',
    description: m.description || m['description'] || '',
    category: m.category || m['category'] || 'other',
    creatorAddress: m.creatorAddress || m['creator_address'] || m.creator_address || '',
    creatorName: m.creatorName || m['creator_name'] || m.creator_name || 'anonymous',
    createdAt: m.createdAt || m['created_at'] || Date.now(),
    endDate: m.endDate || m['endDate'] || m['end_date'] || 0,
    status: m.status || 'active',
    oracleType: (m.oracleType || m['oracle_type'] || 'manual') as Market['oracleType'],
    oracleConfig: m.oracleConfig || m['oracle_config'] || undefined,
    outcomes: {
      yes: { label: yes.label || 'Да', probability: Number(yes.probability || 50), pool: Number(yes.pool || 0) },
      no: { label: no.label || 'Нет', probability: Number(no.probability || 50), pool: Number(no.pool || 0) },
    },
    totalVolume: Number(m.totalVolume || m['total_volume'] || 0),
    voters: m.voters || m['voters'] || [],
    history: m.history || m['history'] || [],
  };
}

interface AppState {
  markets: Market[];
  user: UserProfile;
  activeTab: TabType;
  filter: FilterType;
  selectedMarket: Market | null;
  showAdmin: boolean;
}

interface AppContextValue extends AppState {
  setActiveTab: (tab: TabType) => void;
  setFilter: (filter: FilterType) => void;
  selectMarket: (market: Market | null) => void;
  placeBet: (marketId: string, outcome: 'yes' | 'no', amount: number) => Promise<void>;
  createMarket: (market: Omit<Market, 'id' | 'createdAt' | 'outcomes' | 'totalVolume' | 'voters' | 'status'>) => Promise<void>;
  voteOnMarket: (marketId: string, vote: 'yes' | 'no') => Promise<void>;
  resolveMarket: (marketId: string, result: 'yes' | 'no') => Promise<void>;
  setShowAdmin: (show: boolean) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [activeTab, setActiveTab] = useState<TabType>('markets');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>(() => localStorage.getItem('walletAddress') || '');
  const tonRef = useRef<any>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/markets');
      if (!res.ok) throw new Error('Failed to fetch markets');
      const j = await res.json();
      const list = (j.markets || []).map(mapBackendMarketToMarket);
      setMarkets(list);
    } catch (e) {
      console.error('fetchMarkets error', e);
      setMarkets(initialMarkets);
    }
  }, []);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);

  const fetchUser = useCallback(async (address: string) => {
    try {
      const res = await fetch(`/api/user/${address}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const j = await res.json();
      setUser(mapBackendUserToProfile(j));
    } catch (e) {
      console.error('fetchUser error', e);
      setUser(initialUser);
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('walletAddress', walletAddress);
      fetchUser(walletAddress);
    } else {
      localStorage.removeItem('walletAddress');
      setUser(initialUser);
    }
  }, [walletAddress, fetchUser]);

  const connectWallet = useCallback(async () => {
    // Try dynamic import of TonConnect SDK; if not available, fallback to prompt
    try {
      const mod = await import('@tonconnect/sdk');
      const { TonConnect } = mod as any;
      const ton = new TonConnect({ manifestUrl: 'https://bet-ton.onrender.com/.well-known/ton-connect.json' });
      tonRef.current = ton;
      // if already connected
      if ((ton as any).account && (ton as any).account.address) {
        setWalletAddress((ton as any).account.address);
        return;
      }
      const session = await (ton as any).connect();
      const account = (session && (session.account || (ton as any).account && (ton as any).account.address)) || '';
      if (account) setWalletAddress(account);
    } catch (e) {
      const addr = window.prompt('Введите адрес TON (или вставьте ваш кошелёк)');
      if (addr) setWalletAddress(addr.trim());
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    try { tonRef.current?.disconnect?.(); } catch (e) { /* ignore */ }
    setWalletAddress('');
  }, []);

  const refreshUser = useCallback(async () => {
    if (walletAddress) await fetchUser(walletAddress);
  }, [walletAddress, fetchUser]);

  const selectMarket = useCallback((market: Market | null) => {
    setSelectedMarket(market);
  }, []);

  const placeBet = useCallback(async (marketId: string, outcome: 'yes' | 'no', amount: number) => {
    if (!walletAddress) { alert('Пожалуйста, подключите кошелёк'); return; }
    try {
      const res = await fetch(`/api/markets/${marketId}/bet`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, amount, user_address: walletAddress })
      });
      const j = await res.json();
      if (j.market) {
        setMarkets(prev => prev.map(m => m.id === marketId ? mapBackendMarketToMarket(j.market) : m));
        await refreshUser();
      } else {
        alert(j.error || 'Ошибка при ставке');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка сети при размещении ставки');
    }
  }, [walletAddress, refreshUser]);

  const createMarket = useCallback(async (market: Omit<Market, 'id' | 'createdAt' | 'outcomes' | 'totalVolume' | 'voters' | 'status'>) => {
    try {
      const payload = {
        title: market.title,
        description: market.description,
        category: market.category,
        creator_address: walletAddress || market.creatorAddress || '',
        creator_name: market.creatorName || 'anonymous',
        end_date: market.endDate,
        oracle_type: market.oracleType,
        oracle_config: market.oracleConfig,
      };
      const res = await fetch('/api/markets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (j.market) {
        setMarkets(prev => [mapBackendMarketToMarket(j.market), ...prev]);
      } else {
        alert(j.error || 'Ошибка создания рынка');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка сети при создании рынка');
    }
  }, [walletAddress]);

  const voteOnMarket = useCallback(async (marketId: string, vote: 'yes' | 'no') => {
    if (!walletAddress) { alert('Подключите кошелёк'); return; }
    try {
      const res = await fetch(`/api/markets/${marketId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_address: walletAddress, user_name: user.name, vote, stake: 100 }) });
      const j = await res.json();
      if (j.ok) {
        // refetch markets
        await fetchMarkets();
        await refreshUser();
      } else alert(j.error || 'Ошибка голосования');
    } catch (e) { console.error(e); alert('Ошибка сети при голосовании'); }
  }, [walletAddress, user.name, fetchMarkets, refreshUser]);

  const resolveMarket = useCallback(async (marketId: string, result: 'yes' | 'no') => {
    if (!walletAddress) { alert('Подключите кошелёк'); return; }
    try {
      const res = await fetch(`/api/markets/${marketId}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_address: walletAddress, result }) });
      const j = await res.json();
      if (j.ok) {
        await fetchMarkets();
      } else alert(j.error || 'Ошибка резолва');
    } catch (e) { console.error(e); alert('Ошибка сети при резолве'); }
  }, [walletAddress, fetchMarkets]);

  return (
    <AppContext.Provider value={{
      markets, user, activeTab, filter, selectedMarket, showAdmin,
      setActiveTab, setFilter, selectMarket, placeBet, createMarket,
      voteOnMarket, resolveMarket, setShowAdmin, connectWallet, disconnectWallet, refreshUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}
