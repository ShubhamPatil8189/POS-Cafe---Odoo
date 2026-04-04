import React from 'react';
import { motion } from 'framer-motion';

function itemSummary(items) {
  if (!items?.length) return '—';
  return items.map((it) => `${it.qty}x ${it.name}`).join(' • ');
}

export default function DisplayCard({
  order,
  variant,
  isLatest,
  layoutIdPrefix = 'cd',
}) {
  const isPreparing = variant === 'preparing';

  const glowClass = isPreparing
    ? 'shadow-[0_8px_30px_rgba(234,88,12,0.15)] border-orange-200'
    : 'shadow-[0_8px_30px_rgba(16,185,129,0.15)] border-emerald-200';

  return (
    <motion.article
      layout
      layoutId={`${layoutIdPrefix}-${order.id}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative flex flex-col md:flex-row gap-5 rounded-3xl border border-[#E5D5C5] p-5 md:p-6 bg-[#FEFCFA]/95 backdrop-blur-xl ${glowClass} min-w-[340px] max-w-[460px] overflow-hidden`}
    >
      {/* 🔥 Latest highlight inner ring */}
      {isLatest && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl border-[3px] border-orange-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* 📸 FOOD IMAGE THUMBNAIL */}
      {order.image && (
        <div className="shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-sm border border-[#E5D5C5]">
            <img 
              src={order.image} 
              alt="Food thumbnail" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        {/* 🔢 ORDER NUMBER & PAYMENT */}
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-5xl md:text-6xl font-black text-[#2C1810] tracking-tight drop-shadow-sm">
            #{order.id}
          </h1>

          <span
            className={`px-3 py-1 mt-1 rounded-lg text-xs font-black uppercase tracking-wider ${
              order.paid
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {order.paid ? 'Paid ✔' : 'Unpaid'}
          </span>
        </div>

        {/* 👤 CUSTOMER NAME */}
        <div className="text-lg font-bold text-[#8C5D3A] mb-1">
          {order.customerName || `Table ${order.tableNumber}`}
        </div>

        {/* 🍔 ITEMS */}
        <div className="text-sm md:text-base font-semibold text-[#5C3A21] opacity-90 leading-snug">
          {itemSummary(order.items)}
        </div>

        {/* 🔥 STATUS BADGE */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E5D5C5]/60">
          {isPreparing ? (
            <>
              <motion.div
                className="h-2.5 w-2.5 bg-orange-500 rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-orange-700 text-sm font-black uppercase tracking-widest">
                Preparing
              </span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-emerald-600 text-lg"
              >
                ✓
              </motion.div>
              <span className="text-emerald-700 text-sm font-black uppercase tracking-widest">
                Ready to pickup
              </span>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}