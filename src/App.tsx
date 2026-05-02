import { AppProvider, useApp } from './data';
import Header from './components/Header';
import TabBar from './components/TabBar';
import MarketsTab from './components/MarketsTab';
import MarketDetail from './components/MarketDetail';
import CreateBetTab from './components/CreateBetTab';
import ProfileTab from './components/ProfileTab';
import AdminPanel from './components/AdminPanel';

function AppContent() {
  const { activeTab, selectedMarket, showAdmin } = useApp();

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      
      {selectedMarket ? (
        <MarketDetail />
      ) : showAdmin ? (
        <AdminPanel />
      ) : activeTab === 'markets' ? (
        <MarketsTab />
      ) : activeTab === 'create' ? (
        <CreateBetTab />
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
