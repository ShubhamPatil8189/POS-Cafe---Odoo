import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  ChevronLeft, 
  Plus, 
  Minus, 
  Clock, 
  Utensils, 
  CheckCircle2, 
  CreditCard,
  ChefHat,
  Search,
  ArrowRight
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../ui';
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

  // 1. Initialize from URL
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

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
            tax_rate: 5 // Default tax for now
          })),
          checkout_type: type // 'advance' or 'kitchen'
        })
      });

      if (res.ok) {
        setOrderComplete({ type });
        setCart([]);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-indigo-50 max-w-sm w-full">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Order Received!</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            {orderComplete.type === 'kitchen' 
              ? "Your order has been sent to the kitchen. Please enjoy your stay!"
              : "Payment successful. Your table is reserved for 5 minutes for your order preparation."}
          </p>
          <Button variant="primary" className="w-full" onClick={() => setOrderComplete(false)}>
            Back to Menu
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900">Café POS</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Table {tableId || '??'} · Live Menu</span>
          </div>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="w-5 h-5 text-slate-600" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Hero Search */}
      <div className="px-6 py-6 bg-white border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search favorites..."
            className="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Scroller */}
      <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black transition-all ${
            activeCategory === 'all' 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
            : 'bg-white text-slate-500 border border-slate-200'
          }`}
        >
          All Items
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black transition-all ${
              activeCategory === cat.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="px-6 grid grid-cols-1 gap-4">
        {filteredProducts.map(product => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex gap-4 transition-all active:scale-[0.98]"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
               <Utensils className="w-8 h-8 text-slate-300" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-slate-900 leading-tight">{product.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">{product.description || 'Fresh and delicious'}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-black text-indigo-600">₹{parseFloat(product.price).toFixed(2)}</span>
                <button 
                  onClick={() => addToCart(product)}
                  className="bg-slate-100 text-slate-900 p-1.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Persistent Bottom Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-200 p-6 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Total Amount</div>
                  <div className="text-lg font-black text-slate-900 leading-none">₹{total.toFixed(2)}</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setCart([])} className="text-slate-400 hover:text-danger-500">
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => placeOrder('kitchen')}
                disabled={isKitchenLoading}
                className="flex flex-col items-center justify-center py-4 rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 font-black transition-all hover:bg-slate-100 disabled:opacity-50"
              >
                <ChefHat className="w-5 h-5 mb-1.5 text-indigo-500" />
                <span className="text-xs uppercase tracking-wider">Send to Kitchen</span>
              </button>
              <button
                onClick={() => placeOrder('advance')}
                disabled={isKitchenLoading}
                className="flex flex-col items-center justify-center py-4 rounded-3xl bg-indigo-600 text-white font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5 mb-1.5" />
                <span className="text-xs uppercase tracking-wider">Pay Advance</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
