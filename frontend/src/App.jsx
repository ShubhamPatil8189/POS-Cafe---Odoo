import React, { useState, useEffect, useMemo } from 'react';
import API_BASE_URL from './config';
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
import SelfOrderMenu from './components/self_order/SelfOrderMenu';
import AnalyticsDashboard from './components/restaurant/AnalyticsDashboard';

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
  const [activeItem, setActiveItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Design system demo states
  const [inputVal, setInputVal] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [tables, setTables] = useState([]); // Dynamic from backend now
  const [floors, setFloors] = useState(['ground', 'first']); // Can be dynamic or derived

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [prodRes, catRes, tableRes, sessionRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products`, { headers }),
          fetch(`${API_BASE_URL}/categories`, { headers }),
          fetch(`${API_BASE_URL}/tables`, { headers }),
          fetch(`${API_BASE_URL}/sessions/current`, { headers })
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
        if (catRes.ok) setCategories(await catRes.json());
        if (tableRes.ok) {
          const dbTables = await tableRes.json();
          setTables(dbTables.map(t => ({
            id: t.id,
            number: t.table_number,
            seats: t.seats,
            floor: t.floor_id === 2 ? 'first' : 'ground', // Map backend IDs to UI floor names
            state: t.status === 'available' ? 'available' : 'occupied'
          })));
        }
        if (sessionRes.ok) {
          const activeSession = await sessionRes.json();
          if (activeSession) {
            setSession({
              id: activeSession.id,
              status: activeSession.status,
              openingBalance: parseFloat(activeSession.opening_balance || 0),
              sales: {
                cash: parseFloat(activeSession.sales?.cash || 0),
                digital: parseFloat(activeSession.sales?.digital || 0)
              }
            });
          } else {
            setSession({
              status: 'closed',
              openingBalance: 0,
              sales: { cash: 0, digital: 0 }
            });
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  // CMS: Floor and Table CRUD logic (Local state for UI, should be synced with backend in future)
  const handleAddFloor = (name) => {
    if (name && !floors.includes(name.toLowerCase())) {
      setFloors(prev => [...prev, name.toLowerCase()]);
    }
  };

  const handleDeleteFloor = (floorName) => {
    setFloors(prev => prev.filter(f => f !== floorName));
  };

  const handleAddTable = async (floorName, numStr, seatsStr) => {
    const token = localStorage.getItem('token');
    if (!token) {
      addToast('Authentication token missing. Please log in.', 'error');
      return;
    }

    const floor_id = floorName === 'first' ? 2 : 1;
    const table_number = numStr;
    const seats = parseInt(seatsStr) || 4;

    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ floor_id, table_number, seats })
      });

      if (response.ok) {
        const newTable = await response.json();
        setTables(prev => [...prev, {
          id: newTable.id,
          number: newTable.table_number,
          seats: newTable.seats,
          floor: newTable.floor_id === 2 ? 'first' : 'ground',
          state: 'available'
        }]);
        addToast(`Table ${table_number} added successfully!`, 'success');
      } else {
        const errorData = await response.json();
        addToast(errorData.error || 'Failed to add table.', 'error');
      }
    } catch (err) {
      console.error('Error adding table:', err);
      addToast('Network error while adding table.', 'error');
    }
  };

  const handleDeleteTable = async (tableId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      addToast('Authentication token missing. Please log in.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTables(prev => prev.filter(t => t.id !== tableId));
        addToast('Table deleted successfully!', 'success');
      } else {
        const errorData = await response.json();
        addToast(errorData.error || 'Failed to delete table.', 'error');
      }
    } catch (err) {
      console.error('Error deleting table:', err);
      addToast('Network error while deleting table.', 'error');
    }
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

  const handlePaymentComplete = (amount, method, tableId, keepOccupied = false) => {
    // Update active session stats
    setSession(prev => ({
      ...prev,
      sales: {
        cash: method === 'cash' ? prev.sales.cash + amount : prev.sales.cash,
        digital: method !== 'cash' ? prev.sales.digital + amount : prev.sales.digital
      }
    }));

    if (keepOccupied) {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, state: 'occupied', blockedUntil: null } : t));
      addToast(`Payment completed. Table remains Occupied for dining.`, 'success');
    } else {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, state: 'available', blockedUntil: null } : t));
      addToast(`Payment completed. Table is now Available.`, 'success');
    }
  };

  const handleClearTable = async (tableId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      addToast('Authentication token missing. Please log in.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/clear`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, state: 'available', blockedUntil: null } : t));
        addToast('Table cleared and is now available.', 'success');
      } else {
        const errorData = await response.json();
        addToast(errorData.error || 'Failed to clear table.', 'error');
      }
    } catch (err) {
      console.error('Error clearing table:', err);
      addToast('Network error while clearing table.', 'error');
    }
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
      case 'pos':
        return (
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
            onClearTable={handleClearTable}
          />
        );
      case 'kitchen': return <KitchenDashboard />;
      case 'menu': return <ProductManagement user={user} />;
      case 'orders': return <OrdersPage />;
      case 'floors': return <FloorPlan />;
      case 'analytics': return <AnalyticsDashboard />;
      default: return null;
    }
  };

  // Standalone Self-Order Route
  const isSelfOrder = window.location.pathname === '/self-order';
  if (isSelfOrder) {
    return <SelfOrderMenu />;
  }

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

  // Handle interior layout with Sidebar and Navbar
  return (
    <OrderProvider onExternalPayment={handleMarkPaid}>
      <ProductCatalogProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar
            activeItem={activeView}
            onItemClick={(item) => setActiveView(item)}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {['kitchen', 'menu', 'orders', 'floors', 'analytics'].includes(activeView) && (
              <Navbar title={activeView === 'floors' ? 'Floor Plan' : activeView.charAt(0).toUpperCase() + activeView.slice(1)} />
            )}
            
            <main className="flex-1 overflow-y-auto">
              {['kitchen', 'menu', 'orders', 'floors', 'analytics'].includes(activeView) ? (
                <div className="p-4 md:p-6">
                  {renderViewContent()}
                </div>
              ) : (
                renderViewContent()
              )}
            </main>

            <CloseSessionModal
              isOpen={showCloseModal}
              onClose={() => setShowCloseModal(false)}
              onCloseSession={handleCloseSession}
              sessionData={{
                openingBalance: session.openingBalance,
                cashSales: session.sales.cash,
              }}
            />
          </div>
        </div>
      </ProductCatalogProvider>
    </OrderProvider>
  );
}
