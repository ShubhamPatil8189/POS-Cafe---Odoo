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
    <div className="mx-auto max-w-[1600px] pb-8 px-4 md:px-8">
      {/* 1. COMPACT STATUS BAR AT THE TOP */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/20">
            <ChefHat className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">
              Kitchen Pass
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-bold text-success-600 uppercase tracking-widest">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>{activeTickets} Active Ticket{activeTickets === 1 ? '' : 's'} · Live Connection</span>
            </div>
          </div>
        </div>

        {/* 2. FILTERS (NOW NEXT TO STATUS) */}
        <div className="flex flex-wrap gap-2 bg-surface-hover/50 p-1 rounded-2xl border border-border-light">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setKitchenFilter(f.id)}
              className={`rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${kitchenFilter === f.id
                ? 'bg-white text-primary-700 shadow-sm border border-border-light'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN WORKFLOW GRID (MOVED TO TOP) */}
      <LayoutGroup>
        <div
          className={`grid gap-6 ${visibleColumns.length === 1
            ? 'grid-cols-1 md:mx-auto md:max-w-md'
            : visibleColumns.length === 2
              ? 'md:grid-cols-2'
              : 'lg:grid-cols-3'
            }`}
        >
          {visibleColumns.map((col) => {
            const list = ordersByStatus[col.id] ?? [];
            return (
              <section
                key={col.id}
                className={`flex min-h-[500px] flex-col rounded-3xl border border-border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden`}
              >
                {/* Visual Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${col.bar === 'from-amber-50 to-white' ? 'from-amber-400 to-amber-500' : col.id === 'preparing' ? 'from-primary-400 to-primary-500' : 'from-success-400 to-success-500'}`} />
                
                <header className="mb-4 flex items-center justify-between border-b border-border-light pb-4 pt-1">
                  <div>
                    <h2 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.15em] text-text-primary">
                      <span className="text-lg" aria-hidden>{col.emoji}</span>
                      {col.title}
                    </h2>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      {col.subtitle}
                    </p>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-700 ring-1 ring-black/5">
                    {list.length}
                  </span>
                </header>

                <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-1 flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="mb-4 rounded-full bg-slate-50 p-4 ring-1 ring-slate-100">
                        <ChefHat className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Station Clear
                      </p>
                    </motion.div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </LayoutGroup>

      {/* 4. DOCUMENTATION & INFO (MOVED TO BOTTOM) */}
      <div className="mt-12 rounded-3xl border border-border bg-slate-50/50 p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-black tracking-tight text-text-primary flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary-600" />
              Kitchen Operations
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              This display shows only products configured for the kitchen pass. 
              The order number matches the POS receipt for easy dispatch.
            </p>
            
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white border border-border shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Live Products</span>
                <span className="text-xl font-bold text-primary-700">{kitchenCatalog.count}</span>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white border border-border shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Active Load</span>
                <span className="text-xl font-bold text-success-700">{activeTickets}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-text-tertiary mb-4">
              Workflow Guide
            </h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[11px] font-black text-amber-700 uppercase">
                  TC
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">To Cook</p>
                  <p className="text-xs text-text-secondary">Initial stage. Tap card to start preparing.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-[11px] font-black text-primary-700 uppercase">
                  PR
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Preparing</p>
                  <p className="text-xs text-text-secondary">Active line. Mark items as they are finished.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-100 text-[11px] font-black text-success-700 uppercase">
                  CP
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Completed</p>
                  <p className="text-xs text-text-secondary">Ready for pass. Order will disappear from POS pass.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}