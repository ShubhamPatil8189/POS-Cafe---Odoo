import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Package,
  Search,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  DollarSign,
  Tag,
} from 'lucide-react';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { isKitchenEligibleProduct } from '../../config/kitchenConfig';

function formatCategory(slug) {
  if (!slug) return '—';
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductManagement({ user }) {
  const { products, addProduct, updateProduct, deleteProduct, kitchenProductCount } =
    useProductCatalog();
  const isAdmin = user?.role === 'admin';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'beverages',
    image: '',
    sendToKitchen: false,
    available: true,
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q);
      const k = isKitchenEligibleProduct(p);
      const matchesF =
        filter === 'all' || (filter === 'kitchen' && k) || (filter === 'floor' && !k);
      return matchesQ && matchesF;
    });
  }, [products, query, filter]);

  const handleOpenModal = (p = null) => {
    if (p) {
      setEditingProduct(p);
      setFormData({
        name: p.name,
        price: p.price,
        category: p.category,
        image: p.image || '',
        sendToKitchen: p.sendToKitchen || false,
        available: p.available !== undefined ? p.available : true,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        category: 'beverages',
        image: '',
        sendToKitchen: false,
        available: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: Number(formData.price),
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-br from-primary-50/90 via-white to-violet-50/50 p-8 shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent-200/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-primary-600 text-white shadow-2xl shadow-primary-600/30">
              <Package className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-primary-700">
                <Sparkles className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  Global Catalog
                </span>
              </div>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-text-primary md:text-5xl">
                Menu Master
              </h1>
              <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-text-secondary opacity-70">
                Manage your shop's offerings, pricing, and kitchen routing in one high-performance interface.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {isAdmin && (
              <button
                onClick={() => handleOpenModal()}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-primary-600 px-7 py-4 text-sm font-black uppercase tracking-widest text-white shadow-[0_20px_50px_rgba(37,_99,_235,_0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:bg-primary-700 hover:shadow-[0_30px_60px_rgba(37,_99,_235,_0.4)] active:scale-95 active:translate-y-0"
              >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                {/* Icon Wrapper */}
                <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 shadow-inner group-hover:rotate-180 transition-transform duration-500">
                  <Plus className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
                
                <span className="relative">Add New Item</span>

                {/* Animated Shine Effect */}
                <div className="absolute -left-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
              </button>
            )}
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/60 px-5 py-4 shadow-sm backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Total Items
                </p>
                <p className="text-2xl font-black tabular-nums text-text-primary">
                  {products.length}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50 px-5 py-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-800">
                  <ChefHat className="h-3.5 w-3.5" />
                  KDS Enabled
                </p>
                <p className="text-2xl font-black tabular-nums text-orange-900">
                  {kitchenProductCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH/FILTER BAR */}
      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalog or SKU…"
            className="h-14 w-full rounded-2xl border border-border bg-white pl-12 pr-6 text-base font-medium shadow-sm outline-none ring-primary-500/0 transition-all focus:border-primary-400 focus:ring-8 focus:ring-primary-500/5 hover:border-slate-300"
          />
        </div>
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
          {[
            { id: 'all', label: 'All' },
            { id: 'kitchen', label: 'Kitchen' },
            { id: 'floor', label: 'Dine-in only' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                filter === f.id
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-white/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-white shadow-xl shadow-slate-200/50">
        <div className="hidden gap-4 border-b border-border bg-surface-hover/80 px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-text-tertiary md:grid md:grid-cols-[minmax(0,1fr)_8rem_6rem_6rem_8rem]">
          <span>Product Details</span>
          <span>Category</span>
          <span>Price</span>
          <span>Kitchen</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-border-light">
          <AnimatePresence initial={false}>
            {filtered.map((p, i) => {
              const on = Boolean(p.sendToKitchen);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: Math.min(i * 0.015, 0.15) }}
                  className="group flex flex-col gap-4 px-6 py-6 transition-all hover:bg-slate-50 md:grid md:grid-cols-[minmax(0,1fr)_8rem_6rem_6rem_8rem] md:items-center md:gap-4 md:px-8"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[1.25rem] border-2 border-white bg-slate-100 shadow-lg ring-1 ring-slate-200 group-hover:ring-primary-400 group-hover:scale-105 transition-all">
                      <img
                        src={p.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:rotate-3"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-text-primary leading-tight truncate">
                        {p.name}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-text-tertiary opacity-80">
                        SKU {p.id}
                      </p>
                    </div>
                  </div>

                  <div className="hidden text-sm font-bold text-text-secondary md:block">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                      {formatCategory(p.category)}
                    </span>
                  </div>

                  <div className="hidden text-lg font-black tabular-nums text-slate-900 md:block">
                    <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                    {p.price}
                  </div>

                  <div className="flex items-center gap-3 md:justify-start">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      disabled={!isAdmin}
                      onClick={() =>
                        isAdmin && updateProduct(p.id, { sendToKitchen: !on })
                      }
                      className={`relative inline-flex h-8 w-[3rem] shrink-0 items-center rounded-full border-2 transition-all duration-300 ${
                        on
                          ? 'border-orange-400 bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20'
                          : 'border-slate-200 bg-slate-100'
                      } ${!isAdmin ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                          on ? 'translate-x-[1.25rem]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 md:hidden">
                      {on ? 'KDS Active' : 'Off'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100 transition-all hover:bg-primary-600 hover:text-white hover:shadow-lg hover:shadow-primary-500/20 active:scale-90"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-50 text-danger-600 border border-danger-100 transition-all hover:bg-danger-600 hover:text-white hover:shadow-lg hover:shadow-danger-500/20 active:scale-90"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
               <Search className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-900">No matches found</p>
            <p className="text-sm text-slate-400 max-w-xs mt-1">
              Try adjusting your search query or filters for different results.
            </p>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-8 shadow-2xl md:p-10"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900">
                    {editingProduct ? 'Update Item' : 'New Product'}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {editingProduct ? `Editing item ID: ${editingProduct.id}` : 'Create a new item in your catalog'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Tag className="h-3 w-3" /> Product Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-4 text-lg font-bold text-slate-900 outline-none focus:border-primary-500 focus:bg-white transition-all shadow-inner"
                    placeholder="e.g. Avocado Toast"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      <DollarSign className="h-3 w-3" /> Price (₹)
                    </label>
                    <input
                      required
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-4 text-lg font-bold text-slate-900 outline-none focus:border-primary-500 focus:bg-white transition-all shadow-inner"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-4 text-lg font-bold text-slate-900 outline-none focus:border-primary-500 focus:bg-white transition-all shadow-inner appearance-none"
                    >
                      <option value="beverages">Beverages</option>
                      <option value="italian">Italian</option>
                      <option value="indian">Indian</option>
                      <option value="continental">Continental</option>
                      <option value="dessert">Dessert</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <ImageIcon className="h-3 w-3" /> Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 py-3 text-sm font-bold text-slate-600 outline-none focus:border-primary-500 focus:bg-white transition-all shadow-inner"
                    placeholder="https://..."
                  />
                  {!formData.image && (
                    <p className="text-[10px] text-slate-400 pl-2">A default image will be assigned if left blank.</p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-orange-50/50 p-6 border border-orange-100 shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
                       <ChefHat className="h-6 w-6" />
                    </div>
                    <div>
                       <p className="text-sm font-black text-orange-900">Send to Kitchen</p>
                       <p className="text-[10px] font-bold text-orange-700/60 uppercase">Auto-route to KDS display</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sendToKitchen: !formData.sendToKitchen })}
                    className={`relative inline-flex h-9 w-[3.5rem] items-center rounded-full border-2 transition-all ${
                      formData.sendToKitchen ? 'bg-orange-500 border-orange-400 shadow-md shadow-orange-500/20' : 'bg-slate-200 border-slate-100'
                    }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${formData.sendToKitchen ? 'translate-x-[1.6rem]' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-[1.25rem] bg-slate-100 py-4 font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-[1.25rem] bg-primary-600 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Check className="h-5 w-5" />
                    {editingProduct ? 'Save Changes' : 'Create Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Button (FAB) */}
      {isAdmin && (
        <div className="fixed bottom-8 right-6 z-50 sm:hidden">
          <button
            onClick={() => handleOpenModal()}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white shadow-2xl shadow-primary-600/40 active:scale-95 hover:bg-primary-700 transition-all"
          >
            <Plus className="h-8 w-8" strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}
