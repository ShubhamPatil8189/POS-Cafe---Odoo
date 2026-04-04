import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function Segment({ order }) {
  const paid = Boolean(order.paid);
  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap px-2">
      <span className="font-mono text-xl font-black text-[#2C1810] md:text-2xl">
        #{order.id}
      </span>
      <span className="text-[#8C5D3A]/50">→</span>
      {paid ? (
        <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-black uppercase tracking-wider text-emerald-800 shadow-sm ring-1 ring-emerald-200 md:text-base">
          Paid ✔
        </span>
      ) : (
        <span className="rounded-full bg-red-100 px-4 py-1 text-sm font-black uppercase tracking-wider text-red-800 shadow-sm ring-1 ring-red-200 md:text-base">
          Unpaid
        </span>
      )}
      <span className="text-[#8C5D3A]/30">|</span>
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
      <div className="relative w-full overflow-hidden rounded-2xl border border-[#E5D5C5] bg-white/60 py-5 text-center text-lg text-[#8C5D3A] shadow-sm backdrop-blur-xl">
        No tickets yet — waiting for orders…
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[#E5D5C5] bg-white/60 py-5 shadow-sm backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#FAF8F5] to-transparent md:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#FAF8F5] to-transparent md:w-28" />

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