import React, { useEffect, useMemo, useState } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionTemplate,
  useMotionValue,
  animate,
} from 'framer-motion';
import DisplayCard from './DisplayCard';
import OrderTicker from './OrderTicker';

import { useOrders } from '../components/restaurant/OrderContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** KDS uses `completed` or `ready` */
function isReadyStatus(status) {
  return status === 'ready' || status === 'completed';
}

export default function CustomerDisplay() {
  const { orders } = useOrders();

  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === 'preparing'),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => isReadyStatus(o.status)),
    [orders]
  );

  const latestId = useMemo(() => {
    const pool = [...preparingOrders, ...readyOrders];
    if (!pool.length) return null;
    return pool.reduce((best, o) =>
      o.createdAt > best.createdAt ? o : best
    ).id;
  }, [preparingOrders, readyOrders]);

  const [typed, setTyped] = useState('');
  const servingPhrase = useMemo(() => {
    const p = preparingOrders
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)[0];
    const r = readyOrders
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    
    if (p) {
      const name = p.customerName ? ` for ${p.customerName}` : '';
      return `Now preparing order #${p.orderNumber || p.id}${name} (Table ${p.tableNumber})…`;
    }
    if (r) {
      const name = r.customerName ? ` for ${r.customerName}` : '';
      return `Order #${r.orderNumber || r.id}${name} — please collect at the counter`;
    }
    return 'Welcome — your order will appear here';
  }, [preparingOrders, readyOrders]);

  useEffect(() => {
    setTyped('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(servingPhrase.slice(0, i));
      if (i >= servingPhrase.length) window.clearInterval(id);
    }, 42);
    return () => window.clearInterval(id);
  }, [servingPhrase]);

  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  useEffect(() => {
    const cx = animate(bgX, [0, 100, 0], {
      duration: 18,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    const cy = animate(bgY, [0, 80, 0], {
      duration: 22,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => {
      cx.stop();
      cy.stop();
    };
  }, [bgX, bgY]);

  const bgGradient = useMotionTemplate`radial-gradient(ellipse 80% 60% at ${bgX}% ${bgY}%, rgba(88, 28, 135, 0.45) 0%, transparent 55%)`;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#030014] text-white">
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage: bgGradient }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-black via-[#0a0520] to-[#1e1b4b]/90" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(139,92,246,0.25),transparent)]" />

      {/* Floating blobs */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="pointer-events-none fixed rounded-full opacity-30 blur-3xl"
          style={{
            width: `${18 + i * 8}rem`,
            height: `${18 + i * 8}rem`,
            left: `${15 + i * 28}%`,
            top: `${20 + i * 22}%`,
            background:
              i === 0
                ? 'radial-gradient(circle, rgba(168,85,247,0.5), transparent)'
                : i === 1
                  ? 'radial-gradient(circle, rgba(59,130,246,0.4), transparent)'
                  : 'radial-gradient(circle, rgba(236,72,153,0.35), transparent)',
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 14 + i * 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col px-4 py-8 md:px-10 md:py-12">
        {/* Header */}
        <header className="mb-10 text-center md:mb-14">
          <motion.p
            className="mb-4 text-4xl md:text-5xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            🍽️
          </motion.p>
          <motion.h1
            className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 bg-[length:200%_auto] bg-clip-text text-4xl font-black uppercase tracking-[0.15em] text-transparent drop-shadow-[0_0_40px_rgba(167,139,250,0.6)] sm:text-5xl md:text-6xl lg:text-7xl"
            style={{
              WebkitBackgroundClip: 'text',
              animation: 'cd-shimmer 8s linear infinite',
            }}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            Order status board
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 min-h-[2.5rem] max-w-3xl text-lg font-semibold text-violet-200/90 md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {typed}
            <span className="ml-1 inline-block h-6 w-0.5 animate-pulse bg-fuchsia-400 align-middle" />
          </motion.p>
        </header>

        {/* Section 1 — Preparing */}
        <section className="mb-12 md:mb-16">
          <motion.div
            className="mb-6 flex flex-col items-center gap-2 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-center text-2xl font-black uppercase tracking-[0.25em] text-amber-300 drop-shadow-[0_0_24px_rgba(251,191,36,0.7)] md:text-4xl">
              🟡 Now preparing
            </h2>
            <motion.div
              className="h-1 w-48 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent md:w-72"
              layoutId="prep-underline"
              animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.92, 1, 0.92] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <LayoutGroup>
            <div className="flex gap-5 overflow-x-auto pb-4 pt-2 [scrollbar-width:thin] md:gap-8 md:pb-6 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/40">
              <AnimatePresence mode="popLayout">
                {preparingOrders.length === 0 ? (
                  <motion.p
                    key="empty-prep"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full py-12 text-center text-lg text-white/40"
                  >
                    No orders in the kitchen right now
                  </motion.p>
                ) : (
                  preparingOrders.map((order) => (
                    <DisplayCard
                      key={order.id}
                      order={order}
                      variant="preparing"
                      isLatest={order.id === latestId}
                      layoutIdPrefix="cd-prep"
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </section>

        {/* Section 2 — Ready */}
        <section className="mb-12 md:mb-16">
          <motion.div
            className="mb-6 flex flex-col items-center gap-2 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-center text-2xl font-black uppercase tracking-[0.25em] text-emerald-300 drop-shadow-[0_0_28px_rgba(52,211,153,0.75)] md:text-4xl">
              ✅ Ready for pickup
            </h2>
            <div className="h-1 w-48 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent md:w-72" />
          </motion.div>

          <LayoutGroup>
            <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:justify-center md:gap-8">
              <AnimatePresence mode="popLayout">
                {readyOrders.length === 0 ? (
                  <motion.p
                    key="empty-ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full py-10 text-center text-lg text-white/40"
                  >
                    Nothing ready yet — hang tight!
                  </motion.p>
                ) : (
                  readyOrders.map((order) => (
                    <ReadyCardWrapper
                      key={order.id}
                      order={order}
                      isLatest={order.id === latestId}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </section>

        {/* Section 3 — Payment ticker */}
        <section>
          <h2 className="mb-5 text-center text-xl font-black uppercase tracking-[0.2em] text-cyan-200/95 drop-shadow-[0_0_20px_rgba(34,211,238,0.45)] md:text-3xl">
            💳 Payment status
          </h2>
          <OrderTicker orders={orders} />
        </section>
      </div>

      <style>{`
        @keyframes cd-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}

/** Extra entrance flash / pop for ready column */
function ReadyCardWrapper({ order, isLatest }) {
  const [burst, setBurst] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setBurst(false), 900);
    return () => window.clearTimeout(t);
  }, [order.id]);

  return (
    <div className="relative">
      {burst && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl bg-emerald-400/40"
          initial={{ opacity: 0.9, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      )}
      <motion.div
        animate={
          burst
            ? { scale: [1, 1.06, 1] }
            : { y: [0, -6, 0] }
        }
        transition={
          burst
            ? { duration: 0.5 }
            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <DisplayCard
          order={order}
          variant="ready"
          isLatest={isLatest}
          layoutIdPrefix="cd-ready"
        />
      </motion.div>
    </div>
  );
}
