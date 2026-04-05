import React from 'react';
import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft, Coffee, Pizza, UtensilsCrossed, Clock, CheckCircle2, ChefHat, Sparkles } from 'lucide-react';
import CustomerDisplayPanel from './CustomerDisplayPanel';
import OrderTicker from './OrderTicker';
import { useOrders } from '../components/restaurant/OrderContext';

export default function CustomerDisplay({ onNavigate }) {
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  const { orders } = useOrders();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const cx = animate(bgX, [0, 100, 0], {
      duration: 30,
      repeat: Infinity,
      ease: 'linear',
    });
    const cy = animate(bgY, [0, 100, 0], {
      duration: 40,
      repeat: Infinity,
      ease: 'linear',
    });
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      cx.stop();
      cy.stop();
      clearInterval(timer);
    };
  }, [bgX, bgY]);

  // Elegant warm restaurant gradient
  const bgGradient = useMotionTemplate`radial-gradient(ellipse 120% 80% at ${bgX}% ${bgY}%, #FFF5E6 0%, #FFEDD5 50%, #FEE3C0 100%)`;

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#FAF8F5] text-[#2C1810] font-sans tracking-tight">

      {/* Background Animated Gradients - Enhanced */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage: bgGradient }}
      />

      {/* Warm Food Pattern Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02] bg-repeat"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'0.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 2L15 8H9L12 2Z\'/%3E%3Cpath d=\'M12 22L9 16H15L12 22Z\'/%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'4\'/%3E%3C/svg%3E")' }}
      />

      {/* Cafe Background Image - Enhanced opacity */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] bg-cover bg-center mix-blend-multiply"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000&auto=format")' }}
      />

      {/* Subtle grid pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDE1MCwgMTEwLCA3MCwgMC4wNykiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] opacity-40" />

      {/* Top Bar with Back Button and Time */}
      <div className="relative z-20 px-6 py-4 flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-amber-800 text-sm font-semibold shadow-lg hover:bg-white transition border border-amber-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to POS
        </motion.button>

        <div className="text-right">
          <p className="text-sm font-bold text-amber-800 tabular-nums">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-[10px] text-amber-600 uppercase tracking-wide">{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Main Centered Panel with enhanced styling */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-slide-up w-full mt-2 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <CustomerDisplayPanel />
        </div>
        <div className="w-full max-w-[1700px] mx-auto px-4">
          <OrderTicker orders={orders || []} />
        </div>
      </div>

      {/* Decorative ambient elements */}
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating food icons decoration */}
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-20 left-10 text-4xl pointer-events-none opacity-10"
      >
        🍕
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="fixed top-40 right-10 text-4xl pointer-events-none opacity-10"
      >
        🍔
      </motion.div>
      <motion.div
        animate={{ y: [0, -15, 0], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="fixed bottom-40 right-20 text-3xl pointer-events-none opacity-10"
      >
        ☕
      </motion.div>
      <motion.div
        animate={{ y: [0, 15, 0], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="fixed top-20 left-20 text-3xl pointer-events-none opacity-10"
      >
        🥗
      </motion.div>
    </div>
  );
}