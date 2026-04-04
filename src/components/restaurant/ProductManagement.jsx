import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Package, Search, Sparkles } from 'lucide-react';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { isKitchenEligibleProduct } from '../../config/kitchenConfig';

function formatCategory(slug) {
  if (!slug) return '—';
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductManagement() {
  const { products, updateProduct, kitchenProductCount } = useProductCatalog();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        String(p.id).includes(q);
      const k = isKitchenEligibleProduct(p);
      const matchesF =
        filter === 'all' ||
        (filter === 'kitchen' && k) ||
        (filter === 'floor' && !k);
      return matchesQ && matchesF && p;
    });
  }, [products, query, filter]);

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-50/90 via-white to-violet-50/50 p-6 shadow-md md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/25">
              <Package className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-primary-700">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Product management
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                Menu &amp; kitchen routing
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                Turn <span className="font-semibold text-text-primary">Send to kitchen</span> on for
                anything the pass should see. POS and Kitchen Display read this catalog — when you
                save toggles, new orders follow immediately (no separate kitchen list).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/90 px-5 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                On menu
              </p>
              <p className="text-2xl font-black tabular-nums text-text-primary">
                {products.length}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50 px-5 py-3 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-800">
                <ChefHat className="h-3.5 w-3.5" />
                Kitchen display
              </p>
              <p className="text-2xl font-black tabular-nums text-orange-900">
                {kitchenProductCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm font-medium shadow-sm outline-none ring-primary-500/0 transition focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'kitchen', label: 'Kitchen' },
            { id: 'floor', label: 'Bar / floor only' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                filter === f.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'bg-white text-text-secondary ring-1 ring-border hover:bg-surface-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="hidden gap-4 border-b border-border bg-surface-hover/80 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary md:grid md:grid-cols-[minmax(0,1fr)_6rem_5rem_7rem]">
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span className="text-right">Kitchen</span>
        </div>
        <div className="divide-y divide-border-light">
          <AnimatePresence initial={false}>
            {filtered.map((p, i) => {
              const on = Boolean(p.sendToKitchen);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2) }}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-primary-50/30 md:grid md:grid-cols-[minmax(0,1fr)_6rem_5rem_7rem] md:items-center md:gap-4 md:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-hover shadow-sm">
                      <img
                        src={p.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-tertiary">SKU {p.id}</p>
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                      <span className="text-xs font-semibold text-text-secondary">
                        {formatCategory(p.category)}
                      </span>
                      <span className="font-mono text-sm font-bold text-primary-700">
                        ₹{p.price}
                      </span>
                    </div>
                  </div>
                  <span className="hidden text-sm font-semibold text-text-secondary md:block">
                    {formatCategory(p.category)}
                  </span>
                  <span className="hidden font-mono text-sm font-bold text-primary-700 md:block">
                    ₹{p.price}
                  </span>
                  <div className="flex items-center justify-between gap-3 border-t border-border-light pt-3 md:border-t-0 md:justify-end md:pt-0">
                    <span className="text-xs font-bold uppercase tracking-wide text-text-tertiary md:hidden">
                      Send to kitchen
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`Kitchen for ${p.name}`}
                      onClick={() =>
                        updateProduct(p.id, { sendToKitchen: !on })
                      }
                      className={`relative inline-flex h-9 w-[3.25rem] shrink-0 items-center rounded-full border-2 transition-all duration-300 ${
                        on
                          ? 'border-orange-400 bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/25'
                          : 'border-border bg-surface-hover'
                      }`}
                    >
                      <span
                        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                          on ? 'translate-x-[1.35rem]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-text-tertiary">
            No products match your filters.
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-text-tertiary">
        Backend: persist <code className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[11px]">sendToKitchen</code> on
        each product; POS cart lines carry the flag into{' '}
        <code className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[11px]">POST /orders/send-kitchen</code>.
      </p>
    </div>
  );
}
