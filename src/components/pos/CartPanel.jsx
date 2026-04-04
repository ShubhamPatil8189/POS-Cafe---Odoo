import React, { useState, useEffect } from 'react';
import { ChefHat, Trash2, User, ChevronRight, Plus, Minus, Receipt, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui'; // Assuming we can use generic buttons from UI
import { isKitchenEligibleProduct } from '../../config/kitchenConfig';

export default function CartPanel({ cartItems, updateQuantity, clearCart, onPay, customerName, onCustomerClick }) {
  const [total, setTotal] = useState(0);

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotal(newTotal);
  }, [cartItems]);

  return (
    <div className="h-full flex flex-col bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] border-l border-border z-20 relative">
      <div className="px-6 py-5 border-b border-border/60 bg-surface/80 backdrop-blur flex items-center justify-between z-10">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Current Order</h2>
          <span className="text-sm text-text-secondary font-medium">Order #1042</span>
        </div>
        <button 
          onClick={onCustomerClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-semibold ${
            customerName 
              ? 'bg-success-50 text-success-700 border border-success-200' 
              : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-100'
          }`}
        >
          {customerName ? <CheckCircle2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
          {customerName || 'Add Customer'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {cartItems.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-tertiary">
            <Receipt className="w-12 h-12 mb-3 opacity-20" />
            <p>Cart is empty</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center gap-3 bg-white border border-border-light rounded-2xl p-3 shadow-xs animate-slide-left hover:border-primary-200 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-surface-hover overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-text-primary text-sm truncate">{item.name}</h4>
                  {isKitchenEligibleProduct({
                    name: item.name,
                    category: item.category,
                    sendToKitchen: item.sendToKitchen,
                  }) && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-800 ring-1 ring-orange-200/80">
                      <ChefHat className="h-2.5 w-2.5" />
                      KDS
                    </span>
                  )}
                </div>
                <div className="text-primary-700 font-bold mb-1">₹{item.price * item.quantity}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded bg-surface hover:bg-primary-50 flex items-center justify-center text-text-secondary hover:text-primary-600 transition-colors active:scale-90">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded bg-surface hover:bg-primary-50 flex items-center justify-center text-text-secondary hover:text-primary-600 transition-colors active:scale-90">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => updateQuantity(item.id, 0)}
                className="w-8 h-8 rounded-full hover:bg-danger-50 text-text-tertiary hover:text-danger-500 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-surface border-t border-border/80 p-6 pt-5">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-text-secondary font-medium text-sm">
            <span>Subtotal</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary font-medium text-sm">
            <span>Tax (5%)</span>
            <span>₹{(total * 0.05).toFixed(2)}</span>
          </div>
          <div className="h-px w-full bg-border-light my-2 border-dashed"></div>
          <div className="flex justify-between items-end">
            <span className="text-text-primary font-bold">Total</span>
            <span className="text-3xl font-extrabold text-success-500 [text-shadow:_0_0_20px_rgba(16,185,129,0.3)] tabular-nums">
              ₹{(total * 1.05).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" className="!bg-danger-50 !text-danger-600 hover:!bg-danger-100 shadow-none border-none" onClick={clearCart}>
             Clear
          </Button>
          <Button variant="primary" className="!text-lg !py-4 shadow-glow-accent !bg-accent-500 hover:!bg-accent-600" onClick={onPay}>
            Pay
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
