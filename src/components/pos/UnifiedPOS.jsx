import React, { useCallback, useMemo, useState } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Banknote, CreditCard, Power, LogOut, X, User } from 'lucide-react';

import PaymentScreen from './PaymentScreen';
import { ToastContainer } from '../floorplan/Toast';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { useOrders } from '../restaurant/OrderContext';
import { isKitchenEligibleProduct } from '../../config/kitchenConfig';
import Navbar from '../restaurant/Navbar';
import TableGrid from '../restaurant/TableGrid';
import OrderPanel from '../restaurant/OrderPanel';
import OrdersPage from '../restaurant/OrdersPage';
import KitchenDashboard from '../restaurant/KitchenDashboard';
import ProductManagement from '../restaurant/ProductManagement';
import AnalyticsDashboard from '../restaurant/AnalyticsDashboard';

export default function UnifiedPOS({
  user,
  session,
  tables,
  floors,
  onAddFloor,
  onDeleteFloor,
  onAddTable,
  onDeleteTable,
  toasts,
  onCloseSessionClick,
  onOrderSent,
  onPaymentComplete,
  onLogout,
}) {
  const { orders, sendToKitchen, markTableOrdersPaid, kdsToasts } = useOrders();
  const { products } = useProductCatalog();
  const isAdmin = user?.role === 'admin';

  const [posMainView, setPosMainView] = useState('tables');
  const [activeFloor, setActiveFloor] = useState('ground');
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [customerName, setCustomerName] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [tempName, setTempName] = useState('');

  // Automatically gracefully transition to available floor if current active floor gets deleted
  React.useEffect(() => {
    if (floors.length > 0 && !floors.includes(activeFloor)) {
      setActiveFloor(floors[0]);
    }
  }, [floors, activeFloor]);

  const currentTables = tables.filter((t) => t.floor === activeFloor);

  const resolveTable = useCallback(
    (t) => {
      if (t.state === 'blocked' || t.state === 'inactive') return t;

      const active = orders.filter(
        (o) => o.tableNumber === t.number && o.status !== 'completed' && !o.paid
      );
      if (active.some((o) => o.status === 'preparing')) {
        return { ...t, state: 'preparing' };
      }
      if (active.some((o) => o.status === 'toCook')) {
        return { ...t, state: 'occupied' };
      }
      return t;
    },
    [orders]
  );

  const categoryTabs = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.available || !p.sendToKitchen) return false;
      const matchesCat =
        activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const cartTotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const cartTotalWithTax = cartTotal * 1.05;

  const handleTableClick = (table) => {
    setSelectedTable(table);
  };

  const addToCart = (product) => {
    if (!selectedTable) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [{ ...product, quantity: 1 }, ...prev];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

   const handlePlaceOrder = () => {
    if (cart.length === 0 || !selectedTable) return;
    const ok = sendToKitchen(selectedTable.number, cart, customerName);
    if (!ok) return;
    onOrderSent(selectedTable.id, cart);
    const nextCart = cart.filter(
      (item) =>
        !isKitchenEligibleProduct({
          name: item.name,
          category: item.category,
          sendToKitchen: item.sendToKitchen,
        })
    );
    setCart(nextCart);
    setCustomerName(null);
    if (nextCart.length === 0) setSelectedTable(null);
  };

  const drawerTotal = session.openingBalance + session.sales.cash;
  const sessionSalesTotal = session.sales.cash + session.sales.digital;

  const mergedToasts = useMemo(
    () => [...(toasts ?? []), ...(kdsToasts ?? [])],
    [toasts, kdsToasts]
  );

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans">
      <div className="z-40 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-white px-6 shadow-sm">
        <div className="flex h-full items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-500 p-1">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-700">
                1
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Active Session
              </p>
              <p className="text-sm font-bold text-text-primary">Terminal 1</p>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-border-light md:block" />

          <div className="hidden gap-8 md:flex md:items-center">
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Opening Float
              </p>
              <p className="text-sm font-bold tabular-nums text-text-secondary">
                ₹{session.openingBalance.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-success-500" />
              <div>
                <p className="mb-0.5 flex gap-1 text-[10px] font-bold uppercase tracking-wider text-success-600">
                  Cash Sales
                </p>
                <p className="text-sm font-black tabular-nums text-success-700">
                  ₹{session.sales.cash.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-info-500" />
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-info-600">
                  UPI/Card Sales
                </p>
                <p className="text-sm font-bold tabular-nums text-info-700">
                  ₹{session.sales.digital.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mx-2 hidden h-8 w-px bg-border-light lg:block" />
            <div className="hidden rounded-lg border border-border bg-surface-hover px-4 py-1.5 lg:block">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Expected Drawer
              </p>
              <p className="text-lg font-black leading-none tabular-nums text-text-primary">
                ₹{drawerTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-border lg:flex">
            <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-[8px] font-black text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-[11px] font-bold text-text-secondary">{user?.name || 'User'}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface-base px-4 py-2 font-bold text-text-secondary shadow-sm transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onCloseSessionClick}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-2 font-bold text-danger-700 shadow-sm transition-colors hover:bg-danger-100"
            >
              <Power className="h-4 w-4" />
              <span className="hidden sm:inline">Close Session</span>
            </button>
          )}
        </div>
      </div>

      <Navbar currentView={posMainView} onViewChange={setPosMainView} isAdmin={isAdmin} />

      {posMainView === 'tables' && (
        <div className="relative flex flex-1 overflow-hidden bg-background">
          <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[40rem] w-[40rem] rounded-full bg-amber-400/5 blur-[100px]" />
          
          <LayoutGroup>
            <motion.div
              layout
              initial={false}
              animate={{ 
                width: selectedTable ? '15%' : '100%', 
                minWidth: selectedTable ? '260px' : '100%' 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full z-10 flex shrink-0 border-r border-border"
            >
              <TableGrid
                isAdmin={isAdmin}
                activeFloor={activeFloor}
                onFloorChange={setActiveFloor}
                floors={floors}
                onAddFloor={onAddFloor}
                onDeleteFloor={onDeleteFloor}
                tables={currentTables}
                onAddTable={onAddTable}
                onDeleteTable={onDeleteTable}
                selectedTable={selectedTable}
                onTableClick={handleTableClick}
                sessionSalesTotal={sessionSalesTotal}
                resolveTable={resolveTable}
                isCollapsed={!!selectedTable}
              />
            </motion.div>

            <motion.div
              layout
              initial={false}
              animate={{ 
                opacity: selectedTable ? 1 : 0, 
                x: selectedTable ? 0 : 20, 
                width: selectedTable ? '85%' : '0%',
                flex: selectedTable ? 1 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative z-0 flex h-full bg-[#FCFCFD] shrink-0 overflow-hidden ${!selectedTable && 'pointer-events-none'}`}
            >
              <OrderPanel
                selectedTable={selectedTable}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                categoryTabs={categoryTabs}
                filteredProducts={filteredProducts}
                addToCart={addToCart}
                cart={cart}
                updateQuantity={updateQuantity}
                clearCart={() => {
                  setCart([]);
                  setCustomerName(null);
                }}
                cartTotalWithTax={cartTotalWithTax}
                onSendToKitchen={handlePlaceOrder}
                onPay={() => setShowPayment(true)}
                customerName={customerName}
                onCustomerClick={() => {
                  setTempName(customerName || '');
                  setShowCustomerModal(true);
                }}
              />
            </motion.div>
          </LayoutGroup>
        </div>
      )}

      {posMainView === 'orders' && (
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8">
          <OrdersPage />
        </div>
      )}

      {posMainView === 'menu' && (
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8">
          <ProductManagement user={user} />
        </div>
      )}

      {posMainView === 'kitchen' && (
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8">
          <KitchenDashboard />
        </div>
      )}

      {posMainView === 'analytics' && (
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-[#f8f8fb] px-4 py-6 md:px-8">
          {isAdmin
            ? <AnalyticsDashboard />
            : (
              <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                <div className="w-20 h-20 bg-purple-50 text-purple-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-purple-100">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Admin Only</h2>
                <p className="text-slate-400 max-w-xs">Analytics & reporting is restricted to administrators.</p>
              </div>
            )
          }
        </div>
      )}

      <PaymentScreen
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={cartTotalWithTax}
        onPaymentSuccess={(method) => {
          if (!selectedTable) return;
          
          // 1. Mark ANY existing pending orders for this table as PAID in the context
          markTableOrdersPaid(selectedTable.number);

          // 2. Clear remaining items in cart by 'placing' them as a PAID order record
          if (cart.length > 0) {
            sendToKitchen(selectedTable.number, cart, customerName, true);
          }
          
          // 3. UI and Persistent Table state updates
          onPaymentComplete(cartTotalWithTax, method, selectedTable.id);
          setCart([]);
          setShowPayment(false);
          setSelectedTable(null);
        }}
      />
      {/* Global Customer Modal to prevent z-index issues with sidebar footer */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900">Customer Info</h3>
                <button 
                  onClick={() => setShowCustomerModal(false)} 
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Enter customer name..."
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl font-bold text-xl text-slate-800 outline-none transition-all shadow-inner"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setCustomerName(tempName || null);
                        setShowCustomerModal(false);
                      }
                    }}
                  />
                </div>
                
                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => {
                      setCustomerName(null);
                      setTempName('');
                      setShowCustomerModal(false);
                    }}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors active:scale-95"
                  >
                    Remove
                  </button>
                  <button 
                    onClick={() => {
                      setCustomerName(tempName || null);
                      setShowCustomerModal(false);
                    }}
                    className="flex-1 py-4 bg-primary-600 text-white font-extrabold rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-600/30 transition-all active:scale-95"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={mergedToasts} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(61,29,107,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(61,29,107,0.2); }
      `}</style>
    </div>
  );
}
