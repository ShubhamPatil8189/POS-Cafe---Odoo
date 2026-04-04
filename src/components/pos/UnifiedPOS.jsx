import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Power, Receipt, Banknote, CreditCard, ChevronRight } from 'lucide-react';

import TableCard from '../floorplan/TableCard';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import CartPanel from './CartPanel';
import PaymentScreen from './PaymentScreen';
import { ToastContainer } from '../floorplan/Toast';

// Mock data
const mockProducts = [
  // Italian
  { id: 101, name: 'Margherita Pizza', price: 450, category: 'italian', calories: 800, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 102, name: 'Penne Arrabbiata', price: 380, category: 'italian', calories: 650, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 103, name: 'Classic Lasagna', price: 520, category: 'italian', calories: 950, image: 'https://images.unsplash.com/photo-1619881589316-56c7f9e6b587?q=80&w=600&auto=format&fit=crop', available: true },
  // Continental
  { id: 201, name: 'Caesar Salad', price: 290, category: 'continental', calories: 340, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 202, name: 'Grilled Chicken', price: 580, category: 'continental', calories: 680, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', available: true },
  // Indian
  { id: 501, name: 'Paneer Masala', price: 340, category: 'indian', calories: 480, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 502, name: 'Chicken Biryani', price: 450, category: 'indian', calories: 720, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop', available: true },
  // Beverages
  { id: 601, name: 'Latte Macchiato', price: 180, category: 'beverages', calories: 120, image: 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?q=80&w=600&auto=format&fit=crop', available: true },
  { id: 602, name: 'Iced Caramel', price: 220, category: 'beverages', calories: 240, image: 'https://images.unsplash.com/photo-1461023058943-07cb84a0d8da?q=80&w=600&auto=format&fit=crop', available: true },
];

export default function UnifiedPOS({ 
  session, 
  tables, 
  onTableSelect, 
  toasts, 
  onCloseSessionClick,
  onOrderSent,
  onPaymentComplete
}) {
  const [activeFloor, setActiveFloor] = useState('ground');
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);

  // Filter Tables
  const currentTables = tables.filter(t => t.floor === activeFloor);

  // Filter Products
  const filteredProducts = mockProducts.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartTotalWithTax = cartTotal * 1.05; // 5% tax

  const handleTableClick = (table) => {
    setSelectedTable(table);
  };

  const addToCart = (product) => {
    if (!selectedTable) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
         return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [{ ...product, quantity: 1 }, ...prev];
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    }
  };

  const handlePlaceOrder = () => {
     if (cart.length === 0 || !selectedTable) return;
     onOrderSent(selectedTable.id, cart);
     setCart([]);
     setSelectedTable(null);
  };

  // Live calculation for header tracker
  const drawerTotal = session.openingBalance + session.sales.cash;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      
      {/* 1. SESSION RUNNING DASHBOARD (ALWAYS VISIBLE STICKY TOP BAR) */}
      <div className="h-[72px] bg-white border-b border-border shadow-sm flex items-center justify-between px-6 z-40 shrink-0">
         
         {/* Left Side: Stats Tracker */}
         <div className="flex items-center gap-8 h-full">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full border-2 border-primary-500 flex items-center justify-center p-1">
                 <div className="w-full h-full bg-primary-50 rounded-full flex items-center justify-center text-primary-700 font-black">1</div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Active Session</p>
                  <p className="text-sm font-bold text-text-primary">Terminal 1</p>
               </div>
            </div>

            <div className="h-8 w-px bg-border-light block"></div>

            <div className="flex gap-8 items-center">
               <div>
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-0.5">Opening Float</p>
                  <p className="text-sm font-bold text-text-secondary tabular-nums">₹{session.openingBalance.toFixed(2)}</p>
               </div>
               <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-success-500" />
                  <div>
                    <p className="text-[10px] font-bold text-success-600 uppercase tracking-wider mb-0.5 flex gap-1">Cash Sales</p>
                    <p className="text-sm font-black text-success-700 tabular-nums">₹{session.sales.cash.toFixed(2)}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-info-500" />
                  <div>
                    <p className="text-[10px] font-bold text-info-600 uppercase tracking-wider mb-0.5">UPI/Card Sales</p>
                    <p className="text-sm font-bold text-info-700 tabular-nums">₹{session.sales.digital.toFixed(2)}</p>
                  </div>
               </div>
               <div className="h-8 w-px bg-border-light block mx-2"></div>
               <div className="bg-surface-hover px-4 py-1.5 rounded-lg border border-border">
                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-0.5">Expected Drawer</p>
                  <p className="text-lg font-black text-text-primary tabular-nums leading-none">₹{drawerTotal.toFixed(2)}</p>
               </div>
            </div>
         </div>

         {/* Right Side: Actions */}
         <button 
           onClick={onCloseSessionClick}
           className="flex items-center gap-2 px-4 py-2 bg-danger-50 hover:bg-danger-100 text-danger-700 border border-danger-200 rounded-xl font-bold transition-colors shadow-sm"
         >
           <Power className="w-4 h-4" />
           Close Session
         </button>
      </div>

      {/* SPLIT LAYOUT CONTAINER */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-amber-400/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* ==================================================== */}
        {/* LEFT PANE: FLOOR PLAN (45% Width) */}
        {/* ==================================================== */}
        <div className="w-[45%] h-full flex flex-col border-r border-border bg-surface-base relative z-10">
           {/* Top Bar for Floor */}
           <div className="px-6 py-4 flex items-center justify-between border-b border-white/50 bg-white/30 backdrop-blur-md">
             <div className="flex bg-white p-1 rounded-xl shadow-sm border border-border">
                {['ground', 'first'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setActiveFloor(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${activeFloor === f ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {f} Floor
                  </button>
                ))}
             </div>
             
             {/* Total sales badge for visibility */}
             <div className="px-3 py-1 bg-primary-600 text-white rounded-full text-xs font-bold shadow-md shadow-primary-500/20">
               Total: ₹{(session.sales.cash + session.sales.digital).toFixed(2)}
             </div>
           </div>

           {/* Grid Layout */}
           <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {currentTables.map(t => (
                  <div key={t.id} className="relative">
                    {/* Ring highlight if selected */}
                    {selectedTable?.id === t.id && (
                      <motion.div layoutId="tableSelection" className="absolute -inset-2 border-2 border-primary-500 bg-primary-500/5 z-0 rounded-[2rem]" />
                    )}
                    <div className="relative z-10 w-full h-full">
                       <TableCard table={t} onClick={handleTableClick} />
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>


        {/* ==================================================== */}
        {/* RIGHT PANE: ORDER PANEL (55% Width) */}
        {/* ==================================================== */}
        <div className="w-[55%] h-full flex bg-[#FCFCFD] relative z-0">
          
          {selectedTable ? (
             <>
               {/* Left side of right pane: Catalog */}
               <div className="flex-1 flex flex-col min-w-0 border-r border-border">
                  
                  {/* Active Table Banner + Search */}
                  <div className="px-5 py-4 border-b border-border/50 bg-white sticky top-0 z-20 flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center border border-primary-200">
                             <MapPin className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-text-tertiary tracking-wider uppercase mb-0.5">Ordering For</p>
                              <h2 className="text-xl font-black text-text-primary leading-none">Table {selectedTable.number}</h2>
                           </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${selectedTable.state === 'available' ? 'bg-surface-hover' : selectedTable.state === 'occupied' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'}`}>
                           {selectedTable.state}
                        </div>
                     </div>
                     <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input 
                          type="text" 
                          placeholder="Search menu..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-surface-hover border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary-400 focus:bg-white transition-all shadow-inner"
                        />
                     </div>
                  </div>

                  {/* Categories */}
                  <div className="px-5 py-3 bg-white/50 border-b border-border/30 z-10 shrink-0 shadow-sm">
                     <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        {['all', 'italian', 'continental', 'indian', 'beverages'].map(cat => (
                           <button 
                             key={cat} onClick={() => setActiveCategory(cat)}
                             className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-colors border ${activeCategory === cat ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20' : 'bg-white text-text-secondary border-border hover:bg-surface-hover'}`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Products Grid */}
                  <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar bg-surface-base/50">
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredProducts.map(p => (
                        <div key={p.id} className="animate-scale-in">
                          <ProductCard product={p} onAdd={addToCart} />
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               {/* Right side of right pane: Cart context */}
               <div className="w-[320px] shrink-0 h-full bg-white shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20 flex flex-col">
                  {cart.length > 0 ? (
                    <CartPanel 
                      cartItems={cart} updateQuantity={updateQuantity} 
                      clearCart={() => setCart([])} 
                      onPay={() => setShowPayment(true)}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                       <Receipt className="w-12 h-12 text-text-tertiary mb-4 opacity-50" />
                       <p className="font-bold text-text-secondary">No items added</p>
                       <p className="text-sm text-text-tertiary mt-2">Select items from the menu to build the order for Table {selectedTable.number}.</p>
                    </div>
                  )}

                  {/* Place Order CTA mapped to Kitchen Flow, only if there are items */}
                  {cart.length > 0 && (
                    <div className="p-4 bg-white border-t border-border-light relative z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                       <button onClick={handlePlaceOrder} className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-text-primary text-white font-black text-lg transition-transform active:scale-95 shadow-lg shadow-black/10 hover:bg-black">
                          Send to Kitchen
                       </button>
                       <button onClick={() => setShowPayment(true)} className="w-full mt-3 py-3 rounded-xl flex items-center justify-between px-6 bg-primary-50 text-primary-700 font-bold hover:bg-primary-100 transition-colors border border-primary-200">
                          <span>Pay Now</span>
                          <span className="font-black">₹{cartTotalWithTax.toFixed(2)}</span>
                       </button>
                    </div>
                  )}
               </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden bg-gradient-to-br from-surface-base to-slate-50">
               <div className="absolute w-[200%] h-64 bg-primary-100/30 -rotate-12 blur-3xl pointer-events-none" />
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="relative z-10 w-24 h-24 bg-white shadow-xl shadow-black/5 rounded-3xl flex items-center justify-center mb-6 border border-border"
               >
                 <MapPin className="w-10 h-10 text-primary-500" />
               </motion.div>
               <h2 className="text-3xl font-black text-text-primary tracking-tight mb-3">No Table Selected</h2>
               <p className="text-lg text-text-secondary max-w-sm">Tap on any available or occupied table on the left floor plan to manage its orders and payments.</p>
             </div>
          )}

        </div>
      </div>

      <PaymentScreen 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)}
        total={cartTotalWithTax}
        onPaymentSuccess={(method) => {
          onPaymentComplete(cartTotalWithTax, method, selectedTable.id);
          setCart([]);
          setShowPayment(false);
          setSelectedTable(null);
        }}
      />
      <ToastContainer toasts={toasts} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(61,29,107,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(61,29,107,0.2); }
      `}</style>
    </div>
  );
}
