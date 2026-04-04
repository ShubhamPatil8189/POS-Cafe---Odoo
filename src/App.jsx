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

      // If they had an open session, always force them back to the POS so they don't skip the flow.
      if (savedSession?.status === 'open') return 'pos';
      if (savedView) return savedView;
    } catch (e) { }
    return 'dashboard'; // 'login', 'signup', 'dashboard', 'pos'
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

  // Persistence hooks
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
            floors={floors}
            onAddFloor={handleAddFloor}
            onDeleteFloor={handleDeleteFloor}
            onAddTable={handleAddTable}
            onDeleteTable={handleDeleteTable}
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

  if (activeItem === 'floors') {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          activeItem={activeItem}
          onItemClick={setActiveItem}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar title="Floor Plan" subtitle="Manage your restaurant layout" />
          <main className="flex-1 overflow-y-auto p-6">
            <FloorPlan />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Navigation back to auth just for testing */}
        <div className="absolute bottom-4 right-4 z-50">
          <Button variant="danger" size="sm" onClick={() => setActiveView('login')}>
            Lock Screen
          </Button>
        </div>
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
              <div className="absolute top-1/2 right-12 hidden lg:grid grid-cols-3 gap-3 opacity-20">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-white/30"
                  />
                ))}
              </div>
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
                  value="₹1,24,580"
                  change="12.5%"
                  changeType="positive"
                  icon={DollarSign}
                />
                <StatsCard
                  title="Orders Today"
                  value="284"
                  change="8.2%"
                  changeType="positive"
                  icon={ShoppingCart}
                />
                <StatsCard
                  title="Active Customers"
                  value="1,429"
                  change="3.1%"
                  changeType="negative"
                  icon={Users}
                />
                <StatsCard
                  title="Avg. Order Value"
                  value="₹438"
                  change="5.4%"
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
                  {/* Primary row */}
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

                  {/* Semantic */}
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Semantic Variants
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="success" icon={Check}>
                        Confirm Order
                      </Button>
                      <Button variant="danger" icon={Trash2}>
                        Delete
                      </Button>
                      <Button variant="outline-danger">Cancel Order</Button>
                      <Button variant="ghost-danger">Remove</Button>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Sizes
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="xs">Extra Small</Button>
                      <Button size="sm">Small</Button>
                      <Button size="md">Medium</Button>
                      <Button size="lg">Large</Button>
                      <Button size="xl">Extra Large</Button>
                    </div>
                  </div>

                  {/* With Icons */}
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      With Icons
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button icon={Plus}>Add Item</Button>
                      <Button variant="outline" icon={Filter}>
                        Filter
                      </Button>
                      <Button variant="accent" iconRight={ArrowRight}>
                        Next Step
                      </Button>
                      <Button variant="ghost" icon={Edit3}>
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* States */}
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      States
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button loading>Loading...</Button>
                      <Button disabled>Disabled</Button>
                      <Button size="icon" variant="outline" icon={Plus} />
                      <Button size="icon-sm" variant="ghost" icon={Edit3} />
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
                  <CardHeader>
                    <CardTitle>Text Inputs</CardTitle>
                  </CardHeader>
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
                      helperText="We'll never share your email."
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Enter password"
                      icon={Lock}
                    />
                    <SearchInput placeholder="Search menu items..." />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Input States</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Error State"
                      placeholder="Invalid input"
                      value="bad@input"
                      error="Please enter a valid email address."
                      icon={Mail}
                    />
                    <Input
                      label="Disabled Input"
                      placeholder="Cannot edit"
                      disabled
                      value="Read-only value"
                    />
                    <Textarea
                      label="Order Notes"
                      placeholder="Add special instructions for this order..."
                      helperText="Max 200 characters"
                    />
                  </CardContent>
                </Card>
              </div>
            </Section>

            <Divider />

            {/* ═══ Badges ═══ */}
            <Section
              id="badges"
              title="Badges"
              description="Status indicators, tags, and label components."
            >
              <Card>
                <CardHeader>
                  <CardTitle>Badge Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Standard
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="primary">Primary</Badge>
                      <Badge variant="accent">Accent</Badge>
                      <Badge variant="success">Success</Badge>
                      <Badge variant="danger">Danger</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      With Dot Indicator
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success" dot>
                        Completed
                      </Badge>
                      <Badge variant="accent" dot>
                        In Progress
                      </Badge>
                      <Badge variant="danger" dot>
                        Cancelled
                      </Badge>
                      <Badge variant="primary" dot>
                        New Order
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      With Icons
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary" icon={Coffee}>
                        Latte
                      </Badge>
                      <Badge variant="accent" icon={Clock}>
                        15 min
                      </Badge>
                      <Badge variant="success" icon={Check}>
                        Paid
                      </Badge>
                      <Badge variant="danger" icon={Trash2}>
                        Deleted
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                      Sizes & Removable
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge size="sm" variant="primary">
                        Small
                      </Badge>
                      <Badge size="md" variant="primary">
                        Medium
                      </Badge>
                      <Badge size="lg" variant="primary">
                        Large
                      </Badge>
                      <Badge variant="accent" removable onRemove={() => { }}>
                        Extra Cheese
                      </Badge>
                      <Badge variant="success" removable onRemove={() => { }}>
                        Oat Milk
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Divider />

            {/* ═══ Cards ═══ */}
            <Section
              id="cards"
              title="Cards"
              description="Content containers with hover effects and structured layouts."
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card hover>
                  <div className="w-full h-36 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl mb-4 flex items-center justify-center">
                    <Coffee className="w-10 h-10 text-primary-500" />
                  </div>
                  <Badge variant="accent" size="sm" className="mb-2">
                    Popular
                  </Badge>
                  <h3 className="text-base font-semibold text-text-primary">
                    Cappuccino
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Rich espresso with steamed milk foam
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-primary-700">
                      ₹180
                    </span>
                    <Button size="sm" icon={Plus}>
                      Add
                    </Button>
                  </div>
                </Card>

                <Card hover>
                  <div className="w-full h-36 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl mb-4 flex items-center justify-center">
                    <UtensilsCrossedIcon />
                  </div>
                  <Badge variant="success" size="sm" dot className="mb-2">
                    Available
                  </Badge>
                  <h3 className="text-base font-semibold text-text-primary">
                    Avocado Toast
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Sourdough with fresh avocado &amp; egg
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-primary-700">
                      ₹320
                    </span>
                    <Button size="sm" icon={Plus}>
                      Add
                    </Button>
                  </div>
                </Card>

                <Card hover>
                  <div className="w-full h-36 bg-gradient-to-br from-danger-100 to-danger-200 rounded-xl mb-4 flex items-center justify-center">
                    <Star className="w-10 h-10 text-danger-400" />
                  </div>
                  <Badge variant="danger" size="sm" dot className="mb-2">
                    Last 2 left
                  </Badge>
                  <h3 className="text-base font-semibold text-text-primary">
                    Strawberry Cake
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Fresh layered cake with cream filling
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-primary-700">
                      ₹280
                    </span>
                    <Button size="sm" icon={Plus}>
                      Add
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Card with footer */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription>
                      Review your current order before checkout.
                    </CardDescription>
                  </div>
                  <Badge variant="accent" dot>
                    3 items
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Cappuccino × 2', price: '₹360' },
                      { name: 'Avocado Toast × 1', price: '₹320' },
                      { name: 'Strawberry Cake × 1', price: '₹280' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-text-primary font-medium">
                          {item.name}
                        </span>
                        <span className="text-sm font-semibold text-text-primary">
                          {item.price}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 border-t border-border-light">
                      <span className="text-base font-bold text-text-primary">
                        Total
                      </span>
                      <span className="text-xl font-extrabold text-primary-700">
                        ₹960
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost">Clear Cart</Button>
                  <Button variant="accent" icon={ShoppingCart}>
                    Place Order
                  </Button>
                </CardFooter>
              </Card>
            </Section>

            <Divider />

            {/* ═══ Table ═══ */}
            <Section
              id="table"
              title="Tables"
              description="Data tables with sortable columns and row actions."
            >
              <Card padding="none">
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      Recent Orders
                    </h3>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Showing last 5 orders
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" icon={Filter}>
                      Filter
                    </Button>
                    <Button variant="primary" size="sm" icon={Plus}>
                      New Order
                    </Button>
                  </div>
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader sortable sortDir="desc">
                        Order ID
                      </TableHeader>
                      <TableHeader sortable>Customer</TableHeader>
                      <TableHeader>Items</TableHeader>
                      <TableHeader sortable>Amount</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      {
                        id: '#ORD-2847',
                        customer: 'Amit Sharma',
                        items: 'Cappuccino, Toast',
                        amount: '₹540',
                        status: 'Completed',
                        statusVariant: 'success',
                      },
                      {
                        id: '#ORD-2846',
                        customer: 'Priya Patel',
                        items: 'Latte, Cake',
                        amount: '₹460',
                        status: 'Preparing',
                        statusVariant: 'accent',
                      },
                      {
                        id: '#ORD-2845',
                        customer: 'Rahul Gupta',
                        items: 'Espresso ×2',
                        amount: '₹280',
                        status: 'Pending',
                        statusVariant: 'warning',
                      },
                      {
                        id: '#ORD-2844',
                        customer: 'Sneha K.',
                        items: 'Sandwich, Juice',
                        amount: '₹390',
                        status: 'Completed',
                        statusVariant: 'success',
                      },
                      {
                        id: '#ORD-2843',
                        customer: 'Vikram R.',
                        items: 'Cold Brew',
                        amount: '₹220',
                        status: 'Cancelled',
                        statusVariant: 'danger',
                      },
                    ].map((row) => (
                      <TableRow key={row.id} clickable>
                        <TableCell>
                          <span className="font-semibold text-primary-700">
                            {row.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center text-white text-xs font-bold">
                              {row.customer
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <span className="font-medium">{row.customer}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-text-secondary">
                            {row.items}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{row.amount}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.statusVariant} dot size="sm">
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              icon={Eye}
                            />
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              icon={Edit3}
                            />
                            <Button
                              size="icon-sm"
                              variant="ghost-danger"
                              icon={Trash2}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Section>

            <Divider />

            {/* ═══ Modals ═══ */}
            <Section
              id="modals"
              title="Modals"
              description="Dialog windows for focused interactions."
            >
              <Card>
                <CardHeader>
                  <CardTitle>Modal Dialogs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setShowModal(true)} icon={Plus}>
                      Open Modal
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setShowConfirm(true)}
                      icon={Trash2}
                    >
                      Confirm Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Standard Modal */}
              <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Add New Menu Item"
                description="Fill in the details for the new item."
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      icon={Check}
                      onClick={() => setShowModal(false)}
                    >
                      Save Item
                    </Button>
                  </>
                }
              >
                <div className="space-y-4">
                  <Input label="Item Name" placeholder="e.g. Caramel Latte" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Price (₹)"
                      type="number"
                      placeholder="0.00"
                    />
                    <Input
                      label="Category"
                      placeholder="e.g. Beverages"
                    />
                  </div>
                  <Textarea
                    label="Description"
                    placeholder="Brief description of the item..."
                  />
                </div>
              </Modal>

              {/* Confirm Modal */}
              <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => setShowConfirm(false)}
                title="Delete this order?"
                description="This will permanently delete order #ORD-2843. This action cannot be undone."
                confirmText="Delete Order"
              />
            </Section>

            {/* ═══ Color Palette ═══ */}
            <Section
              id="colors"
              title="Color System"
              description="The curated color palette powering the design system."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary */}
                <Card>
                  <CardTitle>Primary — Deep Purple</CardTitle>
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {[
                      { shade: '50', bg: 'bg-primary-50' },
                      { shade: '100', bg: 'bg-primary-100' },
                      { shade: '200', bg: 'bg-primary-200' },
                      { shade: '300', bg: 'bg-primary-300' },
                      { shade: '400', bg: 'bg-primary-400' },
                      { shade: '500', bg: 'bg-primary-500' },
                      { shade: '600', bg: 'bg-primary-600' },
                      { shade: '700', bg: 'bg-primary-700' },
                      { shade: '800', bg: 'bg-primary-800' },
                      { shade: '900', bg: 'bg-primary-900' },
                    ].map((c) => (
                      <div key={c.shade} className="text-center">
                        <div
                          className={`h-12 rounded-xl ${c.bg} border border-black/5`}
                        />
                        <p className="text-[10px] font-medium text-text-tertiary mt-1.5">
                          {c.shade}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Accent */}
                <Card>
                  <CardTitle>Accent — Amber</CardTitle>
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {[
                      { shade: '50', bg: 'bg-accent-50' },
                      { shade: '100', bg: 'bg-accent-100' },
                      { shade: '200', bg: 'bg-accent-200' },
                      { shade: '300', bg: 'bg-accent-300' },
                      { shade: '400', bg: 'bg-accent-400' },
                      { shade: '500', bg: 'bg-accent-500' },
                      { shade: '600', bg: 'bg-accent-600' },
                      { shade: '700', bg: 'bg-accent-700' },
                      { shade: '800', bg: 'bg-accent-800' },
                      { shade: '900', bg: 'bg-accent-900' },
                    ].map((c) => (
                      <div key={c.shade} className="text-center">
                        <div
                          className={`h-12 rounded-xl ${c.bg} border border-black/5`}
                        />
                        <p className="text-[10px] font-medium text-text-tertiary mt-1.5">
                          {c.shade}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Section>

            {/* ═══ Typography ═══ */}
            <Section
              id="typography"
              title="Typography"
              description="Inter font family with a refined type scale."
            >
              <Card>
                <div className="space-y-4">
                  {[
                    { size: 'text-4xl', weight: 'font-extrabold', label: '4XL / Extrabold', text: 'Total Revenue — ₹1,24,580' },
                    { size: 'text-3xl', weight: 'font-bold', label: '3XL / Bold', text: 'Menu Categories' },
                    { size: 'text-2xl', weight: 'font-semibold', label: '2XL / Semibold', text: 'Order Summary' },
                    { size: 'text-xl', weight: 'font-semibold', label: 'XL / Semibold', text: 'Customer Details' },
                    { size: 'text-lg', weight: 'font-medium', label: 'LG / Medium', text: 'Cappuccino — Double Shot' },
                    { size: 'text-base', weight: 'font-normal', label: 'Base / Regular', text: 'A delicious blend of espresso and steamed milk.' },
                    { size: 'text-sm', weight: 'font-normal', label: 'SM / Regular', text: 'Table 5 · Dine-in · 2 guests' },
                    { size: 'text-xs', weight: 'font-medium', label: 'XS / Medium', text: 'LAST UPDATED 5 MIN AGO' },
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-2 border-b border-border-light last:border-0"
                    >
                      <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest w-36 shrink-0">
                        {t.label}
                      </span>
                      <span className={`${t.size} ${t.weight} text-text-primary`}>
                        {t.text}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </Section>

            {/* Footer */}
            <div className="text-center py-8">
              <p className="text-sm text-text-tertiary">
                Crafted with ☕ for <span className="font-semibold text-primary-700">Café POS</span> — Design System v1.0
              </p>
            </div>
          </div>
        </main>
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
