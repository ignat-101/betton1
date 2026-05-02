export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  creatorAddress: string;
  creatorName: string;
  createdAt: number;
  endDate: number;
  status: 'active' | 'voting' | 'resolved' | 'cancelled';
  oracleType: 'crypto' | 'manual' | 'weather' | 'other';
  oracleConfig?: string;
  outcomes: {
    yes: {
      label: string;
      probability: number;
      pool: number;
    };
    no: {
      label: string;
      probability: number;
      pool: number;
    };
  };
  totalVolume: number;
  voters: Voter[];
  resolution?: 'yes' | 'no';
  resolvedAt?: number;
  image?: string;
}

export interface Voter {
  address: string;
  name: string;
  vote: 'yes' | 'no';
  stake: number;
  timestamp: number;
}

export interface UserBet {
  marketId: string;
  outcome: 'yes' | 'no';
  amount: number;
  timestamp: number;
}

export interface UserProfile {
  address: string;
  name: string;
  balance: number;
  reputation: number;
  totalBets: number;
  wins: number;
  losses: number;
  referralCode: string;
  referrals: number;
  referralEarnings: number;
  bets: UserBet[];
  isAdmin: boolean;
}

export type TabType = 'markets' | 'create' | 'profile';
export type FilterType = 'all' | 'crypto' | 'sports' | 'politics' | 'weather' | 'other';
