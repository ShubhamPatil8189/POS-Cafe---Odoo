import React, { useMemo } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { ChefHat, Radio, UtensilsCrossed } from 'lucide-react';
import { summarizeKitchenProducts } from '../../config/kitchenConfig';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { useOrders } from './OrderContext';
import TicketCard from './TicketCard';

const columns = [
  {
    id: 'toCook',
    title: 'To Cook',
    subtitle: 'Newly received from POS',
    emoji: '🟡',
    bar: 'from-amber-50 to-white',
  },
  {
    id: 'preparing',
    title: 'Preparing',
    subtitle: 'On the line now',
    emoji: '🔥',
    bar: 'from-primary-50 to-white',
  },
  {
    id: 'completed',
    title: 'Completed',
    subtitle: 'Ready / picked up',
    emoji: '✅',
    bar: 'from-success-50 to-white',
  },
];

export default function KitchenDashboard() {
  const { orders, ordersByStatus, kitchenFilter, setKitchenFilter } =
    useOrders();
  const { products } = useProductCatalog();

  const kitchenCatalog = useMemo(
    () => summarizeKitchenProducts(products),
    [products]
  );

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'toCook', label: 'To Cook' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'completed', label: 'Completed' },
  ];

  const visibleColumns =
    kitchenFilter === 'all'
      ? columns
      : columns.filter((c) => c.id === kitchenFilter);

  const activeTickets = orders.filter((o) => o.status !== 'completed').length;

  return (
    <div className="mx-auto max-w-[1600px] pb-8">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          Columns · filter view
        </p>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setKitchenFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ring-1 transition ${
                kitchenFilter === f.id
                  ? 'bg-primary-600 text-white ring-primary-600 shadow-md shadow-primary-500/20'
                  : 'bg-white text-text-secondary ring-border hover:bg-surface-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <LayoutGroup>
        <div
          className={`grid gap-4 transition-all duration-500 ${
            visibleColumns.length === 1
              ? 'grid-cols-1 md:mx-auto md:max-w-md'
              : visibleColumns.length === 2
                ? 'md:grid-cols-2'
                : 'lg:grid-cols-3'
          }`}
        >
          {visibleColumns.map((col) => {
            let list = ordersByStatus[col.id] ?? [];
            if (col.id === 'completed') {
              // Increased to 10 minimum as requested
              list = [...list]
                .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
                .slice(0, 10);
            }
            return (
              <section
                key={col.id}
                className={`flex h-[820px] flex-col rounded-2xl border border-border bg-gradient-to-b p-4 shadow-sm transition-all ${col.bar}`}
              >
                <header className="mb-3 border-b border-border-light pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-primary">
                      <span aria-hidden>{col.emoji}</span>
                      {col.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-text-secondary ring-1 ring-border">
                      {list.length}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-text-tertiary">
                    {col.subtitle}
                  </p>
                </header>
                <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-1 overflow-x-hidden">
                  <AnimatePresence mode="popLayout">
                    {list.map((order) => (
                      <TicketCard
                        key={order.id}
                        order={order}
                        column={col.id}
                      />
                    ))}
                  </AnimatePresence>
                  {list.length === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-24 text-center text-sm text-text-tertiary"
                    >
                      No orders here
                    </motion.p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </LayoutGroup>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.2); }
      `}</style>


    </div>
  );
}
