import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Market, UserProfile, TabType, FilterType, Voter } from './types';

const ADMIN_WALLET = 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';

const initialMarkets: Market[] = [
  {
    id: '1',
    title: 'BTC выше $100,000 к 1 февраля?',
    description: 'Будет ли цена Bitcoin выше $100,000 на момент 1 февраля 2026 года по данным CoinGecko.',
    category: 'crypto',
    creatorAddress: 'EQAh...k3d2',
    creatorName: 'crypto_whale',
    createdAt: Date.now() - 86400000 * 3,
    endDate: Date.now() + 86400000 * 5,
    status: 'active',
    oracleType: 'crypto',
    oracleConfig: 'bitcoin',
    outcomes: {
      yes: { label: 'Да', probability: 72, pool: 15400 },
      no: { label: 'Нет', probability: 28, pool: 5900 },
    },
    totalVolume: 21300,
    voters: [],
  },
  {
    id: '2',
    title: 'ETH выше $4,500 к 15 февраля?',
    description: 'Будет ли цена Ethereum выше $4,500 на момент 15 февраля 2026 года по данным CoinGecko.',
    category: 'crypto',
    creatorAddress: 'EQBx...9m1k',
    creatorName: 'eth_trader',
    createdAt: Date.now() - 86400000 * 1,
    endDate: Date.now() + 86400000 * 12,
    status: 'active',
    oracleType: 'crypto',
    oracleConfig: 'ethereum',
    outcomes: {
      yes: { label: 'Да', probability: 45, pool: 8200 },
      no: { label: 'Нет', probability: 55, pool: 10100 },
    },
    totalVolume: 18300,
    voters: [],
  },
  {
    id: '3',
    title: 'TON в топ-5 криптовалют к марту?',
    description: 'Войдёт ли TON в топ-5 криптовалют по рыночной капитализации к 1 марта 2026 года.',
    category: 'crypto',
    creatorAddress: 'EQDk...7j2n',
    creatorName: 'ton_believer',
    createdAt: Date.now() - 86400000 * 5,
    endDate: Date.now() + 86400000 * 30,
    status: 'active',
    oracleType: 'crypto',
    oracleConfig: 'the-open-network',
    outcomes: {
      yes: { label: 'Да', probability: 23, pool: 4300 },
      no: { label: 'Нет', probability: 77, pool: 14200 },
    },
    totalVolume: 18500,
    voters: [],
  },
  {
    id: '4',
    title: 'Снег в Москве на Новый год?',
    description: 'Будет ли снежный покров в Москве 31 декабря 2025 года по данным Гидрометцентра.',
    category: 'weather',
    creatorAddress: 'EQAr...4d1m',
    creatorName: 'weather_man',
    createdAt: Date.now() - 86400000 * 10,
    endDate: Date.now() + 86400000 * 2,
    status: 'voting',
    oracleType: 'weather',
    outcomes: {
      yes: { label: 'Да', probability: 85, pool: 12700 },
      no: { label: 'Нет', probability: 15, pool: 2200 },
    },
    totalVolume: 14900,
    voters: [
      { address: 'EQCv...2k1p', name: 'auditor_1', vote: 'yes', stake: 500, timestamp: Date.now() - 3600000 },
      { address: 'EQDx...8n3q', name: 'auditor_2', vote: 'yes', stake: 300, timestamp: Date.now() - 1800000 },
      { address: 'EQFz...5m7r', name: 'auditor_3', vote: 'no', stake: 200, timestamp: Date.now() - 900000 },
    ],
  },
  {
    id: '5',
    title: 'Роскосмос запустит миссию к Луне в 2026?',
    description: 'Официальный запуск миссии к Луне со стороны Роскосмоса в 2026 году.',
    category: 'other',
    creatorAddress: 'EQGl...6t9s',
    creatorName: 'space_fan',
    createdAt: Date.now() - 86400000 * 7,
    endDate: Date.now() + 86400000 * 60,
    status: 'active',
    oracleType: 'manual',
    outcomes: {
      yes: { label: 'Да', probability: 12, pool: 1800 },
      no: { label: 'Нет', probability: 88, pool: 13200 },
    },
    totalVolume: 15000,
    voters: [],
  },
  {
    id: '6',
    title: 'Цена TON выше $8 к 1 марта?',
    description: 'Будет ли цена Toncoin выше $8 на момент 1 марта 2026 года по данным CoinGecko.',
    category: 'crypto',
    creatorAddress: 'EQHt...1p4a',
    creatorName: 'diamond_hands',
    createdAt: Date.now() - 86400000 * 2,
    endDate: Date.now() + 86400000 * 25,
    status: 'active',
    oracleType: 'crypto',
    oracleConfig: 'the-open-network',
    outcomes: {
      yes: { label: 'Да', probability: 58, pool: 9100 },
      no: { label: 'Нет', probability: 42, pool: 6600 },
    },
    totalVolume: 15700,
    voters: [],
  },
  {
    id: '7',
    title: 'Финал Лиги Чемпионов — Реал победит?',
    description: 'Выиграет ли Реал Мадрид финал Лиги Чемпионов УЕФА 2026.',
    category: 'sports',
    creatorAddress: 'EQJw...3r6b',
    creatorName: 'football_pro',
    createdAt: Date.now() - 86400000 * 4,
    endDate: Date.now() + 86400000 * 45,
    status: 'active',
    oracleType: 'manual',
    outcomes: {
      yes: { label: 'Да', probability: 34, pool: 5400 },
      no: { label: 'Нет', probability: 66, pool: 10500 },
    },
    totalVolume: 15900,
    voters: [],
  },
];

const mockUser: UserProfile = {
  address: ADMIN_WALLET,
  name: 'flash_user',
  balance: 2500,
  reputation: 87,
  totalBets: 24,
  wins: 16,
  losses: 8,
  referralCode: 'FLASH2026',
  referrals: 7,
  referralEarnings: 350,
  bets: [],
  isAdmin: true,
};

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
  placeBet: (marketId: string, outcome: 'yes' | 'no', amount: number) => void;
  createMarket: (market: Omit<Market, 'id' | 'createdAt' | 'outcomes' | 'totalVolume' | 'voters' | 'status'>) => void;
  voteOnMarket: (marketId: string, vote: 'yes' | 'no') => void;
  resolveMarket: (marketId: string, result: 'yes' | 'no') => void;
  setShowAdmin: (show: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const [user] = useState<UserProfile>(mockUser);
  const [activeTab, setActiveTab] = useState<TabType>('markets');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const selectMarket = useCallback((market: Market | null) => {
    setSelectedMarket(market);
  }, []);

  const placeBet = useCallback((marketId: string, outcome: 'yes' | 'no', amount: number) => {
    setMarkets(prev => prev.map(m => {
      if (m.id !== marketId) return m;
      const updated = { ...m };
      if (outcome === 'yes') {
        updated.outcomes = {
          yes: { ...m.outcomes.yes, pool: m.outcomes.yes.pool + amount },
          no: { ...m.outcomes.no },
        };
      } else {
        updated.outcomes = {
          yes: { ...m.outcomes.yes },
          no: { ...m.outcomes.no, pool: m.outcomes.no.pool + amount },
        };
      }
      updated.totalVolume = updated.outcomes.yes.pool + updated.outcomes.no.pool;
      const yesPool = updated.outcomes.yes.pool;
      const noPool = updated.outcomes.no.pool;
      const total = yesPool + noPool;
      updated.outcomes.yes.probability = Math.round((yesPool / total) * 100);
      updated.outcomes.no.probability = 100 - updated.outcomes.yes.probability;
      return updated;
    }));
  }, []);

  const createMarket = useCallback((market: Omit<Market, 'id' | 'createdAt' | 'outcomes' | 'totalVolume' | 'voters' | 'status'>) => {
    const newMarket: Market = {
      ...market,
      id: String(Date.now()),
      createdAt: Date.now(),
      outcomes: {
        yes: { label: 'Да', probability: 50, pool: 0 },
        no: { label: 'Нет', probability: 50, pool: 0 },
      },
      totalVolume: 0,
      voters: [],
      status: 'active',
    };
    setMarkets(prev => [newMarket, ...prev]);
  }, []);

  const voteOnMarket = useCallback((marketId: string, vote: 'yes' | 'no') => {
    setMarkets(prev => prev.map(m => {
      if (m.id !== marketId) return m;
      const voter: Voter = {
        address: user.address,
        name: user.name,
        vote,
        stake: 100,
        timestamp: Date.now(),
      };
      return { ...m, voters: [...m.voters, voter], status: 'voting' as const };
    }));
  }, [user]);

  const resolveMarket = useCallback((marketId: string, result: 'yes' | 'no') => {
    setMarkets(prev => prev.map(m => {
      if (m.id !== marketId) return m;
      return { ...m, status: 'resolved' as const, resolution: result, resolvedAt: Date.now() };
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      markets, user, activeTab, filter, selectedMarket, showAdmin,
      setActiveTab, setFilter, selectMarket, placeBet, createMarket,
      voteOnMarket, resolveMarket, setShowAdmin,
    }}>
      {children}
    </AppContext.Provider>
  );
}
