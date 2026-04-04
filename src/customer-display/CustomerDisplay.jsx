import React from 'react';
import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import { useEffect } from 'react';
import CustomerDisplayPanel from './CustomerDisplayPanel';
import OrderTicker from './OrderTicker';
import { useOrders } from '../components/restaurant/OrderContext';

export default function CustomerDisplay() {
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  const { orders } = useOrders();

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
    return () => {
      cx.stop();
      cy.stop();
    };
  }, [bgX, bgY]);

  // Elegant subtle cream shifting gradient
  const bgGradient = useMotionTemplate`radial-gradient(ellipse 120% 80% at ${bgX}% ${bgY}%, rgba(243, 235, 225, 0.8) 0%, rgba(255, 252, 248, 1) 100%)`;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#FAF8F5] text-[#2C1810] flex items-center justify-center font-sans tracking-tight">
      
      {/* Background Animated Gradients */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage: bgGradient }}
      />

      {/* Subtle Cafe Background Image Blend */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] bg-cover bg-center mix-blend-multiply"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop")' }}
      />
      
      {/* Subtle grid pattern for professional feel */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDE1MCwgMTEwLCA3MCwgMC4wNSkiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] opacity-50" />

      {/* Main Centered Panel */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-slide-up w-full mt-4">
        <CustomerDisplayPanel />
        <div className="w-[90vw] max-w-[1700px]">
          <OrderTicker orders={orders || []} />
        </div>
      </div>

    </div>
  );
}
