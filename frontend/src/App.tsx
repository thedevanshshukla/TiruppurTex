import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { MerchandiserBoard } from './pages/MerchandiserBoard';
import { OrderSetup } from './pages/OrderSetup';
import { OrderDetail } from './pages/OrderDetail';
import { SupervisorFloor } from './pages/SupervisorFloor';
import { AIInbox } from './pages/AIInbox';
import { BuyerPortal } from './pages/BuyerPortal';
import { ExportReport } from './pages/ExportReport';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('order-board');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Sync default tab with role
  useEffect(() => {
    if (!user) return;
    if (user.role === 'supervisor') {
      setCurrentTab('supervisor-floor');
    } else if (user.role === 'buyer') {
      setCurrentTab('buyer-portal');
    } else {
      setCurrentTab('order-board');
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedOrderId(null);
          setCurrentTab(tab);
        }}
      />

      <main className="flex-1 pb-16">
        {/* Merchandiser Views */}
        {user.role === 'merchandiser' && (
          <>
            {currentTab === 'order-board' && !selectedOrderId && (
              <MerchandiserBoard
                onSelectOrder={(id) => {
                  setSelectedOrderId(id);
                  setCurrentTab('order-detail');
                }}
                onNavigateNewOrder={() => setCurrentTab('new-order')}
              />
            )}

            {currentTab === 'order-detail' && selectedOrderId && (
              <OrderDetail
                orderId={selectedOrderId}
                onBack={() => {
                  setSelectedOrderId(null);
                  setCurrentTab('order-board');
                }}
              />
            )}

            {currentTab === 'new-order' && (
              <OrderSetup
                onBack={() => setCurrentTab('order-board')}
                onSuccess={(newId) => {
                  setSelectedOrderId(newId);
                  setCurrentTab('order-detail');
                }}
              />
            )}

            {currentTab === 'ai-inbox' && <AIInbox />}

            {currentTab === 'export' && (
              <ExportReport onBack={() => setCurrentTab('order-board')} />
            )}
          </>
        )}

        {/* Supervisor Floor View */}
        {user.role === 'supervisor' && <SupervisorFloor />}

        {/* Buyer View */}
        {user.role === 'buyer' && (
          <>
            {currentTab === 'buyer-portal' && (
              <BuyerPortal onNavigateExport={() => setCurrentTab('export')} />
            )}
            {currentTab === 'export' && (
              <ExportReport onBack={() => setCurrentTab('buyer-portal')} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

