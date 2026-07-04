import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DisplayCard from './DisplayCard';

// 5-8 Demo Orders
const DEMO_ORDERS = [
  {
    id: 101,
    customerName: 'Rahul',
    items: [{ name: 'Spicy Chicken Burger', qty: 2 }, { name: 'Iced Coffee', qty: 1 }],
    status: 'preparing',
    paid: true,
    eta: '5 mins',
    createdAt: Date.now() - 120000,
    tableNumber: 5,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 102,
    customerName: 'Sneha',
    items: [{ name: 'Avocado Toast', qty: 1 }],
    status: 'preparing',
    paid: false,
    eta: '8 mins',
    createdAt: Date.now() - 60000,
    tableNumber: 12,
    image: 'https://images.unsplash.com/photo-1588195538328-3e4b7c89f5bc?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 103,
    customerName: 'Amit',
    items: [{ name: 'Espresso', qty: 2 }],
    status: 'preparing',
    paid: true,
    eta: '2 mins',
    createdAt: Date.now() - 30000,
    tableNumber: 3,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c648?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 98,
    customerName: 'Priya',
    items: [{ name: 'Latte', qty: 1 }, { name: 'Muffin', qty: 1 }],
    status: 'ready',
    paid: true,
    createdAt: Date.now() - 300000,
    tableNumber: 2,
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 99,
    customerName: 'Vikram',
    items: [{ name: 'Margherita Pizza', qty: 1 }],
    status: 'ready',
    paid: true,
    createdAt: Date.now() - 240000,
    tableNumber: 7,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 100,
    customerName: 'Rohit',
    items: [{ name: 'Caramel Macchiato', qty: 1 }],
    status: 'ready',
    paid: false,
    createdAt: Date.now() - 150000,
    tableNumber: 9,
    image: 'https://images.unsplash.com/photo-1485608625945-b4618e388ffc?q=80&w=200&auto=format&fit=crop',
  },
];

export default function CustomerDisplayPanel() {
  const [orders, setOrders] = useState(DEMO_ORDERS);

  // Simulate an order transitioning from preparing to ready
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(current => {
        // Find the oldest 'preparing' order
        const preparing = current.filter(o => o.status === 'preparing');
        if (preparing.length > 0) {
          const oldest = preparing.reduce((prev, curr) => (prev.createdAt < curr.createdAt ? prev : curr));
          return current.map(o => o.id === oldest.id ? { ...o, status: 'ready', paid: true } : o);
        }
        return current;
      });
    }, 15000); // every 15s simulate status change
    return () => clearInterval(timer);
  }, []);

  const preparingOrders = orders.filter(o => o.status === 'preparing').sort((a,b) => b.createdAt - a.createdAt);
  const readyOrders = orders.filter(o => o.status === 'ready').sort((a,b) => b.createdAt - a.createdAt);

  // Determine latest order to highlight
  const latestOrder = orders.reduce((prev, curr) => (prev?.createdAt > curr?.createdAt ? prev : curr), orders[0]);

  return (
    <div className="w-[90vw] h-[80vh] max-w-[1700px] flex overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-3xl shadow-[0_30px_100px_rgba(44,24,16,0.1)] border border-[#E5D5C5] relative">
      
      {/* Decorative inner glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-950/20 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-orange-950/10 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-orange-950/10 to-transparent" />

      {/* LEFT SECTION: Now Preparing */}
      <section className="flex-1 flex flex-col border-r border-[#E5D5C5] relative bg-gradient-to-br from-[#FAFAF8]/90 to-[#FOEBE1]/90">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400 opacity-80" />
        
        <header className="p-8 pb-4 shrink-0 flex flex-col items-center justify-center relative">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-[0.2em] text-[#3B2011] drop-shadow-sm">
            Now Preparing
          </h2>
          <p className="text-[#8C5D3A] font-bold tracking-widest uppercase mt-2 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Kitchen is on it
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 2xl:gap-8 auto-rows-max place-items-center">
            <AnimatePresence mode="popLayout">
              {preparingOrders.map(order => (
                <DisplayCard 
                  key={order.id} 
                  order={order} 
                  variant="preparing" 
                  isLatest={order.id === latestOrder?.id} 
                />
              ))}
              {preparingOrders.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                  className="col-span-full h-full flex flex-col items-center justify-center text-orange-900/40 mt-20"
                >
                  <p className="text-xl font-medium tracking-wide">No orders currently preparing</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* RIGHT SECTION: Ready for Pickup */}
      <section className="flex-1 flex flex-col relative bg-emerald-50/40">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 opacity-80" />
        
        <header className="p-8 pb-4 shrink-0 flex flex-col items-center justify-center relative">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-[0.2em] text-emerald-900 drop-shadow-sm">
            Ready To Collect
          </h2>
          <p className="text-emerald-700 font-bold tracking-widest uppercase mt-2 text-sm flex items-center gap-2">
            <span className="text-lg animate-bounce">☕</span>
            Please proceed to counter
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 2xl:gap-8 auto-rows-max place-items-center">
            <AnimatePresence mode="popLayout">
              {readyOrders.map(order => (
                <DisplayCard 
                  key={order.id} 
                  order={order} 
                  variant="ready" 
                  isLatest={order.id === latestOrder?.id} 
                />
              ))}
              {readyOrders.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                  className="col-span-full h-full flex flex-col items-center justify-center text-emerald-900/40 mt-20"
                >
                  <p className="text-xl font-medium tracking-wide">Everything is picked up!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(60,30,10,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(60,30,10,0.2); }
      `}</style>
    </div>
  );
}
