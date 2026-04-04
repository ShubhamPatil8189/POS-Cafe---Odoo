import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function Segment({ order }) {
  const paid = Boolean(order.paid);
  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap px-2">
      <span className="font-mono text-xl font-black text-white/90 md:text-2xl">
        #{order.id}
      </span>
      <span className="text-white/40">→</span>
      {paid ? (
        <span className="rounded-full bg-emerald-500/25 px-4 py-1 text-sm font-black uppercase tracking-wider text-emerald-200 shadow-[0_0_24px_rgba(34,197,94,0.5)] ring-1 ring-emerald-400/50 md:text-base">
          Paid ✔
        </span>
      ) : (
        <span className="rounded-full bg-rose-500/20 px-4 py-1 text-sm font-black uppercase tracking-wider text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.35)] ring-1 ring-rose-400/40 md:text-base">
          Unpaid
        </span>
      )}
      <span className="text-white/30">|</span>
    </span>
  );
}

export default function OrderTicker({ orders }) {
  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  );

  const segments = useMemo(
    () =>
      sorted.map((order) => <Segment key={`a-${order.id}`} order={order} />),
    [sorted]
  );

  const duration = Math.max(24, sorted.length * 5);

  if (!sorted.length) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 py-5 text-center text-lg text-white/50 shadow-inner backdrop-blur-xl">
        No tickets yet — waiting for orders…
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 py-5 shadow-inner backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#030014] to-transparent md:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#030014] to-transparent md:w-28" />

      <motion.div
        className="flex w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration,
            ease: 'linear',
          },
        }}
      >
        <div className="flex shrink-0 items-center gap-2 pr-8">
          {segments}
        </div>
        <div className="flex shrink-0 items-center gap-2 pr-8" aria-hidden>
          {sorted.map((order) => (
            <Segment key={`b-${order.id}`} order={order} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
