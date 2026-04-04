import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  Coffee,
  Star,
  Clock,
  Check,
  ArrowRight,
  Download,
  Filter,
  Mail,
  Lock,
  Eye,
} from 'lucide-react';

import {
  Button,
  Input,
  SearchInput,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatsCard,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Modal,
  ConfirmModal,
  Sidebar,
  Navbar,
} from './components/ui';

import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import POSLayout from './components/pos/POSLayout';
import FloorPlan from './components/pos/FloorPlan';

import Dashboard from './components/pos/Dashboard';
import UnifiedPOS from './components/pos/UnifiedPOS';
import { OpenSessionModal, CloseSessionModal } from './components/pos/SessionModals';
import { OrderProvider } from './components/restaurant/OrderContext';
import { ProductCatalogProvider } from './context/ProductCatalogContext';

// ─── Section Wrapper ─── //
function Section({ title, description, children, id }) {
  return (
    <section id={id} className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Divider() {
  return <hr className="border-border-light my-2" />;
}

// ─── Showcase App ─── //
export default function App() {
  // Persisted state initializers
  const [activeView, setActiveView] = useState(() => {
    try {
      const savedView = localStorage.getItem('cafe-active-view');
      const savedSession = JSON.parse(localStorage.getItem('cafe-session'));
      const savedUser = JSON.parse(localStorage.getItem('user'));

      // Staff always goes to POS/Floor plan even if session status is unknown
      if (savedUser?.role === 'staff') return 'pos';

      // If they had an open session, always force them back to the POS
      if (savedSession?.status === 'open') return 'pos';
      if (savedView) return savedView;
    } catch (e) { }
    return 'dashboard'; 
  });

  const [session, setSession] = useState(() => {
    try {
      const savedSession = localStorage.getItem('cafe-session');
      if (savedSession) return JSON.parse(savedSession);
    } catch (e) { }
    return {
      status: 'closed',
      openingBalance: 0,
      sales: { cash: 0, digital: 0 }
    };
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) { }
    return null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Staff goes directly to Floor Plan, Admin goes to Dashboard
    if (userData.role === 'staff') {
      setActiveView('pos');
    } else {
      setActiveView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveView('login');
  };
  useEffect(() => {
    localStorage.setItem('cafe-active-view', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('cafe-session', JSON.stringify(session));
  }, [session]);
  const [lastSessionInfo, setLastSessionInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('cafe-last-session');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return null;
  });

  useEffect(() => {
    if (lastSessionInfo) {
      localStorage.setItem('cafe-last-session', JSON.stringify(lastSessionInfo));
    }
  }, [lastSessionInfo]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // -- Floor Plan / Kitchen Flow State --
  const [toasts, setToasts] = useState([]);
  const [tables, setTables] = useState(() => {
    try {
      const savedTables = localStorage.getItem('cafe-tables');
      if (savedTables) return JSON.parse(savedTables);
    } catch (e) { }
    return [
      { id: 1, number: 1, seats: 4, floor: 'ground', state: 'available' },
      { id: 2, number: 2, seats: 2, floor: 'ground', state: 'available' },
      { id: 3, number: 3, seats: 2, floor: 'ground', state: 'available' },
      { id: 4, number: 4, seats: 2, floor: 'ground', state: 'available' },
      { id: 5, number: 5, seats: 4, floor: 'ground', state: 'available' },
      { id: 6, number: 6, seats: 2, floor: 'ground', state: 'available' },
      { id: 7, number: 7, seats: 2, floor: 'ground', state: 'available' },
      { id: 8, number: 8, seats: 2, floor: 'ground', state: 'available' },
      { id: 9, number: 9, seats: 4, floor: 'ground', state: 'available' },
      { id: 10, number: 10, seats: 8, floor: 'ground', state: 'available' },
      { id: 11, number: 101, seats: 4, floor: 'first', state: 'available' },
      { id: 12, number: 102, seats: 4, floor: 'first', state: 'available' },
    ];
  });

  const [floors, setFloors] = useState(() => {
    try {
      const savedFloors = localStorage.getItem('cafe-floors');
      if (savedFloors) return JSON.parse(savedFloors);
    } catch (e) { }
    return ['ground', 'first'];
  });

  useEffect(() => {
    localStorage.setItem('cafe-tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('cafe-floors', JSON.stringify(floors));
  }, [floors]);

  // CMS: Floor and Table CRUD logic
  const handleAddFloor = (name) => {
    if (name && !floors.includes(name.toLowerCase())) {
      setFloors(prev => [...prev, name.toLowerCase()]);
    }
  };

  const handleDeleteFloor = (floorName) => {
    setFloors(prev => prev.filter(f => f !== floorName));
    setTables(prev => prev.filter(t => t.floor !== floorName));
  };

  const handleAddTable = (floorName, numStr, seatsStr) => {
    if (!numStr) return;
    const newTable = {
      id: Date.now(),
      number: parseInt(numStr, 10),
      seats: parseInt(seatsStr, 10) || 4,
      floor: floorName,
      state: 'available'
    };
    setTables(prev => [...prev, newTable]);
  };

  const handleDeleteTable = (tableId) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
  };

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Periodic Table Cleanup (checks for expired blocked sessions every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTables(prev => prev.map(t => {
        if (t.state === 'blocked' && t.blockedUntil && now > t.blockedUntil) {
          return { ...t, state: 'available', blockedUntil: null };
        }
        return t;
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  /** Kitchen stages are driven by the KDS (OrderContext); keep table in sync when a ticket hits the pass */
  const handleOrderSent = (tableId) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, state: 'occupied' } : t
      )
    );
  };

  const handlePaymentComplete = (amount, method, tableId) => {
    // Update active session stats
    setSession(prev => ({
      ...prev,
      sales: {
        cash: method === 'cash' ? prev.sales.cash + amount : prev.sales.cash,
        digital: method !== 'cash' ? prev.sales.digital + amount : prev.sales.digital
      }
    }));

    // Block table for 5 minutes after direct payment
    const blockUntil = Date.now() + (5 * 60 * 1000);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, state: 'blocked', blockedUntil: blockUntil } : t));
    addToast(`Payment completed. Table Occupied for 5 min. Kitchen notified.`, 'success');
  };

  const handleMarkPaid = (tableNumber) => {
    setTables(prev => {
      const table = prev.find(t => t.number === tableNumber);
      if (!table) return prev;

      addToast(`Table ${tableNumber} marked paid and is now Available.`, 'success');
      return prev.map(t => t.id === table.id ? { ...t, state: 'available', blockedUntil: null } : t);
    });
  };

  // Session Management
  const handleOpenSession = (floatAmount) => {
    setSession({
      status: 'open',
      openingBalance: floatAmount,
      sales: { cash: 0, digital: 0 }
    });
    setShowOpenModal(false);
    setActiveView('pos');
  };

  const handleCloseSession = (result) => {
    setLastSessionInfo({
      endTime: Date.now(),
      openingBalance: session.openingBalance,
      cashSales: session.sales.cash,
      totalSales: session.sales.cash + session.sales.digital,
      closingBalance: result.actualCash,
      difference: result.difference
    });
    setSession({
      status: 'closed',
      openingBalance: 0,
      sales: { cash: 0, digital: 0 }
    });
    setShowCloseModal(false);
    setActiveView('dashboard');
  };

  if (activeView === 'login') {
    return (
      <>
        <style>{`aside, .sidebar { display: none !important; }`}</style>
        <Login onNavigate={setActiveView} onLogin={handleLogin} />
      </>
    );
  }

  if (activeView === 'signup') {
    return <Signup onNavigate={setActiveView} />;
  }

  if (activeView === 'dashboard') {
    return (
      <div className="h-screen bg-background">
        <div className="w-full h-full relative">
          <Dashboard
            user={user}
            session={session}
            lastSessionInfo={lastSessionInfo}
            onOpenSessionClick={() => setShowOpenModal(true)}
            onLockScreen={handleLogout}
            onProceedToPOS={() => setActiveView('pos')}
          />
          <OpenSessionModal
            isOpen={showOpenModal}
            onClose={() => setShowOpenModal(false)}
            onOpenSession={handleOpenSession}
          />
        </div>
      </div>
    );
  }

  if (activeView === 'pos') {
    return (
      <OrderProvider onExternalPayment={handleMarkPaid}>
        <ProductCatalogProvider>
          <UnifiedPOS
            user={user}
            session={session}
            tables={tables}
            floors={floors}
            onAddFloor={handleAddFloor}
            onDeleteFloor={handleDeleteFloor}
            onAddTable={handleAddTable}
            onDeleteTable={handleDeleteTable}
            toasts={toasts}
            onOrderSent={handleOrderSent}
            onPaymentComplete={handlePaymentComplete}
            onCloseSessionClick={() => setShowCloseModal(true)}
            onLogout={handleLogout}
          />
          <CloseSessionModal
            isOpen={showCloseModal}
            onClose={() => setShowCloseModal(false)}
            onCloseSession={handleCloseSession}
            sessionData={{
              openingBalance: session.openingBalance,
              cashSales: session.sales.cash,
            }}
          />
        </ProductCatalogProvider>
      </OrderProvider>
    );
  }

  // Handle other views (Kitchen, Menu, etc.) by showing the Sidebar
  const renderViewContent = () => {
    // Role Gate: if staff tries to access these particular views, return restricted message
    if (user?.role === 'staff' && ['floors', 'analytics', 'menu'].includes(activeView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-amber-100">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-sm">This module required administrator permissions. Please contact your manager if you need access to this page.</p>
        </div>
      );
    }

    switch (activeView) {
      case 'kitchen': return <KitchenDashboard />;
      case 'menu': return <ProductManagement user={user} />;
      case 'orders': return <OrdersPage />;
      case 'floors': return <FloorPlan />;
      case 'analytics': return (
        <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-border">
          <h2 className="text-2xl font-black mb-4">Analytics Dashboard</h2>
          <p className="text-text-secondary">Full business analytics and reporting module.</p>
        </div>
      );
      default: return null;
    }
  };

  // Add 'floors' and 'analytics' to the list of views compatible with the main interior layout
  if (['kitchen', 'menu', 'orders', 'floors', 'analytics'].includes(activeView)) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <Navbar title={activeView === 'floors' ? 'Floor Plan' : activeView.charAt(0).toUpperCase() + activeView.slice(1)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <OrderProvider onExternalPayment={() => {}}>
            <ProductCatalogProvider>
              {renderViewContent()}
            </ProductCatalogProvider>
          </OrderProvider>
        </main>
      </div>
    );
  }

  // Final fallback to dashboard if somehow in an invalid state
  setActiveView('dashboard');
  return null;
}
