import React from 'react';
import { motion } from 'framer-motion';
import { useOrders } from './OrderContext';

const statusLabel = {
  toCook: 'To cook',
  preparing: 'Preparing',
  completed: 'Completed',
};

function formatCategory(slug) {
  if (!slug) return null;
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrdersPage() {
  const { orders, markPaid } = useOrders();
  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-text-primary md:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Same numbers as the kitchen: <span className="font-semibold text-text-primary">Order #</span> and{' '}
          <span className="font-semibold text-text-primary">Ticket #</span> match for backend sync. Mark paid when
          the check is settled.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="rounded-2xl border border-border border-dashed bg-white/60 p-10 text-center text-text-secondary backdrop-blur-sm">
            No kitchen orders yet. Send from{' '}
            <span className="font-semibold text-text-primary">Tables</span> with{' '}
            <span className="font-semibold text-text-primary">Send to Kitchen</span>.
          </div>
        )}
        {sorted.map((o, i) => {
          const orderNo = o.orderNumber ?? o.id;
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{
                y: -2,
                boxShadow: '0 16px 40px -16px rgba(61, 29, 107, 0.15)',
              }}
              className="rounded-2xl border border-border bg-white/90 p-5 shadow-sm backdrop-blur-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black tabular-nums text-text-primary">
                    Order #{orderNo}{' '}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      · Ticket #{orderNo}
                    </span>
                  </p>
                  <p className="mt-1 text-base font-bold text-text-secondary">
                    Table {o.tableNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {statusLabel[o.status]} · {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {o.paid ? (
                    <span className="rounded-full bg-success-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-success-800 ring-1 ring-success-200">
                      Paid ✔
                    </span>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => markPaid(o.id)}
                      className="rounded-full bg-primary-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-primary-600/25"
                    >
                      Mark as Paid
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-border-light">
                <div className="grid grid-cols-[3rem_1fr_auto] gap-2 border-b border-border-light bg-surface-hover/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  <span>Qty</span>
                  <span>Item</span>
                  <span className="text-right">Cat.</span>
                </div>
                <ul className="divide-y divide-border-light bg-white/60">
                  {o.items.map((it, idx) => {
                    const cat = formatCategory(it.category);
                    return (
                      <li
                        key={`${o.id}-${it.productId ?? idx}`}
                        className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 px-3 py-2 text-sm"
                      >
                        <span className="font-mono font-bold tabular-nums text-text-primary">
                          ×{it.qty}
                        </span>
                        <span className="font-semibold text-text-primary">{it.name}</span>
                        <span className="text-right text-[10px] font-bold uppercase text-primary-800">
                          {cat ?? '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
