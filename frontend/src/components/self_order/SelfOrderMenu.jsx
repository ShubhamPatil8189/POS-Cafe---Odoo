import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  ChefHat,
  Search,
  CheckCircle2,
  CreditCard,
  X,
  Sparkles,
  Utensils
} from 'lucide-react';
import API_BASE_URL from '../../config';

export default function SelfOrderMenu() {
  const [tableId, setTableId] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [isKitchenLoading, setIsKitchenLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('tableId');
    if (id) setTableId(id);

    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/categories`)
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (cRes.ok) setCategories(await cRes.json());
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'all' || p.category_id === parseInt(activeCategory);
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const next = item.quantity + delta;
        return next > 0 ? { ...item, quantity: next } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTax = cart.reduce((sum, item) => {
    const taxRate = parseFloat(item.tax) || 0;
    return sum + (item.price * item.quantity * (taxRate / 100));
  }, 0);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + cartTax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async (type) => {
    if (!tableId || cart.length === 0) return;
    setIsKitchenLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/self-order/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            tax_rate: item.tax || 0
          })),
          checkout_type: type
        })
      });

      if (res.ok) {
        setOrderComplete({ type });
        setCart([]);
        setIsCartOpen(false);
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setIsKitchenLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl -translate-x-1/2"></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl translate-x-1/3"></div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="bg-white/70 backdrop-blur-xl p-10 sm:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] border border-white max-w-sm w-full relative z-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bouncy: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Order Received!</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm md:text-base">
            {orderComplete.type === 'kitchen' 
              ? "Your masterpiece is currently being prepared by our chefs. Enjoy your dynamic dining experience."
              : "Payment confirmed! Your table is secured for the next 5 minutes while we prepare your items."}
          </p>
          <button 
            onClick={() => setOrderComplete(false)}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors active:scale-[0.98] shadow-lg"
          >
            Start New Order
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] font-sans pb-32 relative selection:bg-indigo-100">
      
      {/* Dynamic Glass Header */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-lg border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.02)] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
             <Utensils className="w-5 h-5" />
           </div>
           <div>
             <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                Café POS
             </h1>
             <div className="flex items-center gap-1.5 mt-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
               <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.15em]">
                 Table {tableId || '??'}
               </span>
             </div>
           </div>
        </div>
        
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <ShoppingCart className="w-5 h-5" />
          <AnimatePresence>
            {totalItems > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-gradient-to-tr from-rose-500 to-pink-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white/70 shadow-sm"
              >
                {totalItems}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {/* Search Hero */}
        <div className="px-6 pt-8 pb-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-xl transition-all group-focus-within:blur-2xl group-focus-within:opacity-100 opacity-50"></div>
            <div className="relative bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden flex items-center pr-2">
              <Search className="w-5 h-5 text-indigo-400 ml-5" />
              <input 
                type="text"
                placeholder="What are you craving today?"
                className="w-full bg-transparent border-none py-5 px-4 text-base font-bold text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="p-2 mr-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                   <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Floating Categories */}
        <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveCategory('all')}
            className={`relative px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black tracking-wide uppercase transition-all duration-300 flex items-center gap-2 ${
              activeCategory === 'all' 
              ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-100' 
              : 'bg-white text-slate-500 border border-slate-200/60 hover:border-indigo-300 hover:text-indigo-600 scale-[0.98]'
            }`}
          >
            {activeCategory === 'all' && <Sparkles className="w-4 h-4 text-indigo-300" />}
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black tracking-wide uppercase transition-all duration-300 ${
                activeCategory === cat.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-100' 
                : 'bg-white text-slate-500 border border-slate-200/60 hover:border-indigo-300 hover:text-indigo-600 scale-[0.98]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="px-6 pt-6 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product, idx) => {
              const inCart = cart.find(c => c.id === product.id);
              const qty = inCart ? inCart.quantity : 0;
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
                  transition={{ delay: idx * 0.03, duration: 0.4 }}
                  key={product.id}
                  className="group relative bg-white/70 backdrop-blur-md rounded-[2rem] p-5 border border-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.15)] hover:border-indigo-100 transition-all duration-300 flex flex-col"
                >
                  <div className="flex gap-5">
                    {/* Minimalist Image Placeholder / Shape */}
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center shrink-0 border border-indigo-50/50 group-hover:scale-105 transition-transform duration-500 ease-out">
                       <span className="text-3xl filter saturate-50 mix-blend-multiply opacity-50">🍽️</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                          {product.description || 'Deliciously crafted for you.'}
                        </p>
                      </div>
                      <div className="mt-3 font-black text-indigo-600 text-xl tracking-tight">
                        ₹{parseFloat(product.price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Add action row */}
                  <div className="mt-5 flex items-center justify-end">
                    {qty === 0 ? (
                      <button 
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all hover:bg-indigo-600 w-full justify-center"
                      >
                        <Plus className="w-4 h-4" /> Add to Order
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-indigo-50 rounded-full p-1.5 w-full justify-between ring-1 ring-indigo-100 shadow-inner">
                        <button 
                          onClick={() => updateQty(product.id, -1)}
                          className="w-10 h-10 rounded-full bg-white text-indigo-600 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-90"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-base text-indigo-900 w-12 text-center select-none">{qty}</span>
                        <button 
                          onClick={() => updateQty(product.id, 1)}
                          className="w-10 h-10 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-700 transition-colors active:scale-90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-4xl grayscale opacity-50">🔍</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No items found</h3>
              <p className="text-slate-500 font-medium">Try searching for something else or browse another category.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer Overlay & Content */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col max-h-[85vh]"
            >
              <div className="w-full flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              </div>
              
              <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900">Your Order</h2>
                <button 
                   onClick={() => setIsCartOpen(false)}
                   className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium">Your cart is feeling a bit empty.</div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                         ✨
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-slate-800 text-sm mb-1">{item.name}</h4>
                         <div className="text-indigo-600 font-black text-sm">₹{parseFloat(item.price).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="font-black text-xs w-2 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6 rounded-t-3xl pt-8 relative">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">To Pay</div>
                      <div className="text-3xl font-black text-slate-900 tracking-tighter">₹{total.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                         Includes ₹{cartTax.toFixed(2)} Tax
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => placeOrder('kitchen')}
                      disabled={isKitchenLoading}
                      className="flex gap-3 justify-center items-center py-4 rounded-xl bg-white border-2 border-indigo-100 text-indigo-700 font-black transition-all hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 disabled:opacity-50"
                    >
                      <ChefHat className="w-5 h-5" />
                      <span>Send to Kitchen</span>
                    </button>
                    <button
                      onClick={() => placeOrder('advance')}
                      disabled={isKitchenLoading}
                      className="flex gap-3 justify-center items-center py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black transition-all shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] active:scale-95 disabled:opacity-50"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Pay Advance</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent Mini Bottom Bar (When Drawer Closed) */}
      <AnimatePresence>
        {!isCartOpen && totalItems > 0 && (
          <motion.div 
            initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }}
            className="fixed bottom-6 left-6 right-6 z-30"
          >
            <div className="max-w-md mx-auto bg-slate-900 text-white rounded-3xl p-2 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                 onClick={() => setIsCartOpen(true)}
            >
              <div className="flex items-center gap-4 px-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black border border-indigo-500/30">
                   {totalItems}
                 </div>
                 <div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total</div>
                   <div className="text-lg font-bold">₹{total.toFixed(2)}</div>
                 </div>
              </div>
              <button 
                className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-8 py-4 rounded-2xl font-black text-sm"
              >
                View Order
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      ` }} />
    </div>
  );
}
