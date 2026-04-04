import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Receipt } from 'lucide-react';
import ProductCard from '../pos/ProductCard';
import CartPanel from '../pos/CartPanel';

/**
 * Right pane: catalog + cart — same chrome as UnifiedPOS (55% width container is parent).
 */
export default function OrderPanel({
  selectedTable,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categoryTabs = ['all', 'italian', 'continental', 'indian', 'beverages'],
  filteredProducts,
  addToCart,
  cart,
  updateQuantity,
  clearCart,
  cartTotalWithTax,
  onSendToKitchen,
  onPay,
  customerName,
  onCustomerClick,
}) {
  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        <div className="px-5 py-4 border-b border-border/50 bg-white sticky top-0 z-20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center border border-primary-200">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-tertiary tracking-wider uppercase mb-0.5">
                  Ordering For
                </p>
                <h2 className="text-xl font-black text-text-primary leading-none">
                  Table {selectedTable?.number ?? '--'}
                </h2>
              </div>
            </div>
            <div
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                selectedTable?.state === 'available'
                  ? 'bg-surface-hover'
                  : selectedTable?.state === 'occupied'
                    ? 'bg-success-100 text-success-700'
                    : 'bg-primary-100 text-primary-700'
              }`}
            >
              {selectedTable?.state ?? '--'}
            </div>
          </div>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-surface-hover border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary-400 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-white/50 border-b border-border/30 z-10 shrink-0 shadow-sm">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {categoryTabs.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-colors border ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20'
                    : 'bg-white text-text-secondary border-border hover:bg-surface-hover'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar bg-surface-base/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id} className="animate-scale-in">
                <ProductCard product={p} onAdd={addToCart} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[320px] shrink-0 h-full bg-white shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20 flex flex-col">
        {cart.length > 0 ? (
          <CartPanel
            cartItems={cart}
            updateQuantity={updateQuantity}
            clearCart={clearCart}
            onPay={onPay}
            customerName={customerName}
            onCustomerClick={onCustomerClick}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <Receipt className="w-12 h-12 text-text-tertiary mb-4 opacity-50" />
            <p className="font-bold text-text-secondary">No items added</p>
            <p className="text-sm text-text-tertiary mt-2">
              Select items from the menu to build the order for Table {selectedTable?.number ?? '--'}.
            </p>
          </div>
        )}

        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-border-light relative z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <button
              type="button"
              onClick={onSendToKitchen}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-text-primary text-white font-black text-lg transition-transform active:scale-95 shadow-lg shadow-black/10 hover:bg-black"
            >
              Send to Kitchen
            </button>
            <button
              type="button"
              onClick={onPay}
              className="w-full mt-3 py-3 rounded-xl flex items-center justify-between px-6 bg-primary-50 text-primary-700 font-bold hover:bg-primary-100 transition-colors border border-primary-200"
            >
              <span>Pay Now</span>
              <span className="font-black">₹{cartTotalWithTax.toFixed(2)}</span>
            </button>
            <p className="mt-3 text-center text-[11px] leading-snug text-text-tertiary">
              Items with <span className="font-semibold text-text-secondary">Send to kitchen</span> turned
              on in <span className="font-semibold text-text-secondary">Menu</span> appear on the KDS
              immediately after Send.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
