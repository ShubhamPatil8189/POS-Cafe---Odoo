import React from 'react';
import { motion } from 'framer-motion';

function itemSummary(items) {
  if (!items?.length) return '—';
  return items.map((it) => `${it.name} ×${it.qty}`).join(' · ');
}

export default function DisplayCard({
  order,
  variant,
  isLatest,
  layoutIdPrefix = 'cd',
}) {
  const isPreparing = variant === 'preparing';
  const glowClass = isPreparing
    ? 'shadow-[0_0_40px_rgba(250,204,21,0.35),inset_0_0_60px_rgba(250,204,21,0.06)] border-amber-400/50'
    : 'shadow-[0_0_48px_rgba(34,197,94,0.45),inset_0_0_50px_rgba(34,197,94,0.08)] border-emerald-400/60';

  const titleColor = isPreparing
    ? 'from-amber-200 via-yellow-100 to-amber-300'
    : 'from-emerald-200 via-green-100 to-emerald-300';

  return (
    <motion.article
      layout
      layoutId={`${layoutIdPrefix}-${order.id}`}
      initial={
        isPreparing
          ? { opacity: 0, y: 100, x: -40, scale: 0.9 }
          : { opacity: 0, scale: 0.55, filter: 'blur(14px)' }
      }
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 22,
      }}
      className={`relative flex min-w-[min(100vw-2rem,22rem)] max-w-md shrink-0 flex-col rounded-3xl border-2 bg-white/5 p-6 backdrop-blur-2xl md:min-w-[24rem] md:p-8 ${glowClass}`}
    >
      {isLatest && (
        <motion.div
          className="pointer-events-none absolute inset-[-4px] rounded-[1.75rem] border-2 border-fuchsia-400/70"
          animate={{
            opacity: [0.45, 1, 0.45],
            scale: [1, 1.02, 1],
            boxShadow: [
              '0 0 20px rgba(232,121,249,0.4)',
              '0 0 50px rgba(232,121,249,0.8)',
              '0 0 20px rgba(232,121,249,0.4)',
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
           <div className="flex flex-col">
             {order.customerName && (
               <span className="text-xs font-black uppercase tracking-widest text-violet-300/80 mb-1">
                 Customer: {order.customerName}
               </span>
             )}
             <p
               className={`bg-gradient-to-br bg-clip-text text-5xl font-black tabular-nums tracking-tighter text-transparent sm:text-6xl md:text-7xl ${titleColor}`}
             >
               #{order.orderNumber || order.id}
             </p>
           </div>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-white/90 ring-1 ring-white/20">
            Table {order.tableNumber}
          </span>
        </div>

        <p className="text-base font-medium leading-relaxed text-white/85 md:text-lg">
          {itemSummary(order.items)}
        </p>

        <div className="flex items-center gap-2">
          {isPreparing ? (
            <>
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-amber-400"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-lg font-bold uppercase tracking-[0.2em] text-amber-200/95">
                Preparing…
              </span>
            </>
          ) : (
            <>
              <motion.span
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl"
              >
                ✨
              </motion.span>
              <span className="text-lg font-bold uppercase tracking-[0.2em] text-emerald-200">
                Ready for pickup
              </span>
            </>
          )}
        </div>
      </div>

      {isPreparing && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl bg-amber-400/5"
          animate={{ opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
    </motion.article>
  );
}
