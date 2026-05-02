import { AppProvider, useApp } from './data';
import Header from './components/Header';
import TabBar from './components/TabBar';
import MarketsTab from './components/MarketsTab';
import MarketDetail from './components/MarketDetail';
import ProbabilityMarketView from './components/ProbabilityMarketView';
import CreateBetTab from './components/CreateBetTab';
import ProfileTab from './components/ProfileTab';
import DisputesTab from './components/DisputesTab';
import AdminPanel from './components/AdminPanel';

function AppContent() {
  const { activeTab, selectedMarket, showAdmin, showProbabilityView } = useApp();

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      
      {selectedMarket && showProbabilityView ? (
        <ProbabilityMarketView />
      ) : selectedMarket ? (
        <MarketDetail />
      ) : showAdmin ? (
        <AdminPanel />
      ) : activeTab === 'markets' ? (
        <MarketsTab />
      ) : activeTab === 'create' ? (
        <CreateBetTab />
      ) : activeTab === 'disputes' ? (
        <DisputesTab />
      ) : (
        <ProfileTab />
      )}

      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
