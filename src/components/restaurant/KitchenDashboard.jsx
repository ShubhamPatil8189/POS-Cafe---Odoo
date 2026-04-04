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
      {/* What KDS shows + backend-oriented summary */}
      <div className="mb-6 rounded-2xl border border-border bg-white/90 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
              <ChefHat className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-text-primary md:text-3xl">
                Kitchen Display
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Shows{' '}
                <span className="font-semibold text-text-primary">
                  only products configured for the kitchen
                </span>{' '}
                from <span className="font-semibold text-text-primary">Menu</span> (per-product
                toggle). Tickets appear{' '}
                <span className="font-semibold text-text-primary">
                  in real time
                </span>{' '}
                when staff taps{' '}
                <span className="font-semibold text-text-primary">
                  Send to Kitchen
                </span>{' '}
                on the POS. Order number and ticket number are the same value for
                dispatch and future API sync.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-hover/80 px-4 py-3 text-xs text-text-secondary">
            <Radio className="h-4 w-4 shrink-0 text-success-500" />
            <span>
              <span className="font-bold text-text-primary">{activeTickets}</span>{' '}
              active ticket{activeTickets === 1 ? '' : 's'} · Live from POS state
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border-light pt-5 md:grid-cols-2">
          <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary-800">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              On kitchen display ({kitchenCatalog.count} products)
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Pulled from product catalog — same list POS uses when sending to the pass.
            </p>
            <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto text-sm text-text-primary custom-scrollbar">
              {kitchenCatalog.items.slice(0, 14).map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white/60 px-2 py-1.5 ring-1 ring-primary-100"
                >
                  <span className="min-w-0 truncate font-medium">{row.name}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                    {row.category}
                  </span>
                </li>
              ))}
            </ul>
            {kitchenCatalog.count > 14 && (
              <p className="mt-2 text-xs text-text-tertiary">
                +{kitchenCatalog.count - 14} more in Menu…
              </p>
            )}
            <p className="mt-3 text-[10px] leading-snug text-text-tertiary">
              Backend: mirror <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[10px]">sendToKitchen</code> on each product.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Order stages &amp; actions
            </p>
            <ol className="mt-2 space-y-2 text-sm text-text-secondary">
              <li>
                <span className="font-bold text-amber-700">To Cook</span> — new
                tickets from POS; tap the{' '}
                <span className="font-semibold text-text-primary">card</span> to
                move forward.
              </li>
              <li>
                <span className="font-bold text-primary-700">Preparing</span> —{' '}
                cooking in progress; tap each{' '}
                <span className="font-semibold text-text-primary">line item</span>{' '}
                to mark prepared (✔ + strike-through).
              </li>
              <li>
                <span className="font-bold text-success-700">Completed</span> —{' '}
                done on the pass (ticket stays for reference).
              </li>
            </ol>
          </div>
        </div>
      </div>

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
          className={`grid gap-4 ${
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
              list = [...list]
                .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
                .slice(0, 5);
            }
            return (
              <section
                key={col.id}
                className={`flex min-h-[420px] flex-col rounded-2xl border border-border bg-gradient-to-b p-4 shadow-sm ${col.bar}`}
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
                <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
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
                      className="py-12 text-center text-sm text-text-tertiary"
                    >
                      No orders in this stage. Waiting for POS send.
                    </motion.p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
