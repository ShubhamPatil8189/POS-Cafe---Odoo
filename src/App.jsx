import React, { useState, useEffect } from 'react';
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
  const [activeView, setActiveView] = useState('dashboard'); // 'login', 'signup', 'dashboard', 'pos', 'admin'
  const [activeItem, setActiveItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // -- Session State --
  const [session, setSession] = useState({
    status: 'closed',
    openingBalance: 0,
    sales: { cash: 0, digital: 0 }
  });
  const [lastSessionInfo, setLastSessionInfo] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // -- Master Data State --
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // -- Floor Plan / Kitchen Flow State --
  const [toasts, setToasts] = useState([]);
  const [tables, setTables] = useState([
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
  ]);

  // UI States for Design System Showcase
  const [inputVal, setInputVal] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/categories`)
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

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

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

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
    return <Login onNavigate={setActiveView} />;
  }

  if (activeView === 'signup') {
    return <Signup onNavigate={setActiveView} />;
  }

  if (activeView === 'dashboard') {
    return (
      <>
        <Dashboard
          session={session}
          lastSessionInfo={lastSessionInfo}
          onOpenSessionClick={() => setShowOpenModal(true)}
          onLockScreen={() => setActiveView('login')}
        />
        <OpenSessionModal
          isOpen={showOpenModal}
          onClose={() => setShowOpenModal(false)}
          onOpenSession={handleOpenSession}
        />
      </>
    );
  }

  if (activeView === 'pos') {
    return (
      <OrderProvider onExternalPayment={handleMarkPaid}>
        <ProductCatalogProvider>
          <UnifiedPOS
            session={session}
            tables={tables}
            toasts={toasts}
            onOrderSent={handleOrderSent}
            onPaymentComplete={handlePaymentComplete}
            onCloseSessionClick={() => setShowCloseModal(true)}
            onLogout={() => setActiveView('login')}
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

  // Admin / Floor / Design System Views with Sidebar Layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute bottom-4 right-4 z-50">
          <Button variant="danger" size="sm" onClick={() => setActiveView('login')}>
            Lock Screen
          </Button>
        </div>

        {activeItem === 'floors' ? (
          <>
            <Navbar title="Floor Plan" subtitle="Manage your restaurant layout" />
            <main className="flex-1 overflow-y-auto p-6">
              <FloorPlan />
            </main>
          </>
        ) : (
          <>
            <Navbar
              title="Design System"
              subtitle="Café POS — Component Showcase"
            />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto px-6 py-8 space-y-16">
                {/* ═══ Hero Banner ═══ */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-8 md:p-12 text-white">
                  <div className="relative z-10">
                    <Badge variant="accent" size="md" className="mb-4">
                      <Star className="w-3 h-3" /> Design System v1.0
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                      Café POS
                      <br />
                      <span className="text-accent-400">Design System</span>
                    </h1>
                    <p className="mt-3 text-primary-200 text-sm md:text-base max-w-lg">
                      A premium, reusable component library crafted for modern
                      restaurant POS applications. Inspired by Stripe, Linear &amp;
                      Notion.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                      <Button variant="accent" icon={Coffee}>
                        Get Started
                      </Button>
                      <Button
                        variant="ghost"
                        className="!text-white/80 hover:!text-white hover:!bg-white/10"
                        icon={Download}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl" />
                </div>

                {/* ═══ Stats Cards ═══ */}
                <Section
                  id="stats"
                  title="Stats Cards"
                  description="At-a-glance metrics with trend indicators."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                      title="Total Revenue"
                      value="₹0"
                      change="0%"
                      changeType="positive"
                      icon={DollarSign}
                    />
                    <StatsCard
                      title="Orders Today"
                      value="0"
                      change="0%"
                      changeType="positive"
                      icon={ShoppingCart}
                    />
                    <StatsCard
                      title="Live Products"
                      value={products.length.toString()}
                      change="+100%"
                      changeType="positive"
                      icon={Coffee}
                    />
                    <StatsCard
                      title="Categories"
                      value={categories.length.toString()}
                      change="Active"
                      changeType="positive"
                      icon={TrendingUp}
                    />
                  </div>
                </Section>

                <Divider />

                {/* ═══ Buttons ═══ */}
                <Section
                  id="buttons"
                  title="Buttons"
                  description="All button variants, sizes, and states."
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Button Variants</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                          Core Variants
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="primary">Primary</Button>
                          <Button variant="secondary">Secondary</Button>
                          <Button variant="accent">Accent</Button>
                          <Button variant="outline">Outline</Button>
                          <Button variant="ghost">Ghost</Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                          Semantic Variants
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="success" icon={Check}>Confirm Order</Button>
                          <Button variant="danger" icon={Trash2}>Delete</Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                          Sizes
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button size="xs">XS</Button>
                          <Button size="sm">SM</Button>
                          <Button size="md">MD</Button>
                          <Button size="lg">LG</Button>
                          <Button size="xl">XL</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Section>

                <Divider />

                {/* ═══ Inputs ═══ */}
                <Section
                  id="inputs"
                  title="Input Fields"
                  description="Text inputs with focus, error, and helper text states."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader><CardTitle>Text Inputs</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <Input
                          label="Customer Name"
                          placeholder="Enter customer name"
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                        />
                        <Input
                          label="Email Address"
                          placeholder="customer@email.com"
                          icon={Mail}
                        />
                        <SearchInput placeholder="Search menu items..." />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>Input States</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <Input
                          label="Error State"
                          placeholder="Invalid input"
                          error="Please enter a valid email address."
                          icon={Mail}
                        />
                        <Textarea label="Order Notes" placeholder="Special instructions..." />
                      </CardContent>
                    </Card>
                  </div>
                </Section>

                <Divider />

                {/* ═══ Stats Cards with Real Data ═══ */}
                <Section
                    id="real-products"
                    title="Real Products"
                    description="Items fetched from the production database."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {products.map(product => (
                            <Card key={product.id} hover className="flex flex-col h-full">
                                <div className="w-full h-32 overflow-hidden rounded-xl mb-3">
                                    <img 
                                        src={product.image_url || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=600&auto=format&fit=crop'} 
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=600&auto=format&fit=crop'; }}
                                    />
                                </div>
                                <h4 className="font-bold text-text-primary text-sm line-clamp-1">{product.name}</h4>
                                <p className="text-xs text-text-secondary mt-1 min-h-[32px] line-clamp-2">{product.description || 'No description'}</p>
                                <div className="mt-auto pt-3 flex items-center justify-between">
                                    <span className="text-primary-700 font-bold">₹{product.price}</span>
                                    <Badge size="xs" variant="outline">{product.category_name}</Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Section>

                {/* Footer */}
                <div className="text-center py-8">
                  <p className="text-sm text-text-tertiary">
                    Crafted with ☕ for <span className="font-semibold text-primary-700">Café POS</span> — Design System v1.0
                  </p>
                </div>
              </div>
            </main>
            
            {/* Design System Modals */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Example Modal"
                footer={<Button onClick={() => setShowModal(false)}>Close</Button>}
            >
                <p>This is a demonstration of the modal component.</p>
            </Modal>
            
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => setShowConfirm(false)}
                title="Confirm Action"
                description="Are you sure you want to perform this action?"
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Inline Icon Components ─── //
function UtensilsCrossedIcon() {
  return (
    <svg
      className="w-10 h-10 text-accent-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
      />
    </svg>
  );
}
