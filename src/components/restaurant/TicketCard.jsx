import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOrders } from './OrderContext';

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatCategory(slug) {
  if (!slug) return null;
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TicketCard({ order, column }) {
  const { advanceOrder, toggleItemPrepared } = useOrders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = formatElapsed((order.completedAt || now) - order.createdAt);
  const isPreparing = order.status === 'preparing';
  /** Same value for POS order id and KDS ticket — backend: single `orderId` */
  const orderNo = order.orderNumber ?? order.id;

  const handleTicketClick = (e) => {
    if (e.target.closest('[data-item-row]')) return;
    if (order.status === 'completed') return;
    advanceOrder(order.id);
  };

  return (
    <motion.article
      layout
      layoutId={`kds-ticket-${order.id}`}
      initial={{
        opacity: 0,
        x: column === 'toCook' ? -16 : column === 'completed' ? 16 : 0,
        y: 14,
      }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      whileHover={{
        rotateZ: order.status === 'completed' ? 0 : -0.6,
        scale: 1.015,
        y: -3,
        boxShadow: '0 12px 40px -12px rgba(61, 29, 107, 0.2)',
      }}
      onClick={handleTicketClick}
      className={`relative cursor-pointer rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-shadow ${
        isPreparing
          ? 'border-primary-300 bg-primary-50/80 ring-2 ring-primary-400/30 animate-pulse-kds'
          : 'border-border bg-white/90 hover:border-primary-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-light pb-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-lg font-black tabular-nums text-text-primary">
              Order #{orderNo}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              · Ticket #{orderNo}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-text-secondary">
            Table {order.tableNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            Time on ticket
          </p>
          <p className="font-mono text-sm font-bold text-primary-700">{elapsed}</p>
        </div>
      </div>

      {order.paid && (
        <div className="mt-3 inline-flex rounded-full bg-success-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success-800 ring-1 ring-success-200">
          Paid ✔
        </div>
      )}

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary">
          Kitchen items
        </p>
        <p className="mt-0.5 text-[11px] text-text-tertiary">
          Quantity and product name as sent from POS
        </p>

        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-white/80">
          <div className="grid grid-cols-[2.75rem_1fr] gap-2 border-b border-border-light bg-surface-hover/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary sm:grid-cols-[2.75rem_1fr_auto]">
            <span>Qty</span>
            <span>Item</span>
            <span className="hidden text-right sm:block">Cat.</span>
          </div>
          <ul className="divide-y divide-border-light">
            {order.items.map((it, idx) => {
              const cat = formatCategory(it.category);
              return (
                <li key={`${order.id}-${it.productId ?? 'x'}-${idx}`}>
                  <button
                    type="button"
                    data-item-row
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemPrepared(order.id, idx);
                    }}
                    className={`grid w-full grid-cols-[2.75rem_1fr] items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-surface-hover sm:grid-cols-[2.75rem_1fr_auto] ${
                      it.prepared ? 'text-text-tertiary' : 'text-text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ${
                          it.prepared
                            ? 'border-success-300 bg-success-50 text-success-700'
                            : 'border-border bg-white text-primary-700'
                        }`}
                      >
                        {it.prepared ? '✔' : '☐'}
                      </span>
                      <span className="font-mono text-xs font-bold tabular-nums">
                        ×{it.qty}
                      </span>
                    </span>
                    <span
                      className={`min-w-0 font-semibold leading-snug ${
                        it.prepared
                          ? 'line-through decoration-text-tertiary'
                          : ''
                      }`}
                    >
                      {it.name}
                    </span>
                    <span className="hidden text-right sm:block">
                      {cat ? (
                        <span className="inline-block rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-800 ring-1 ring-primary-100">
                          {cat}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-tertiary">—</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {order.status !== 'completed' && (
        <p className="mt-3 text-[10px] font-medium text-text-tertiary">
          Card: next stage · Line: mark item prepared
        </p>
      )}
    </motion.article>
  );
}
