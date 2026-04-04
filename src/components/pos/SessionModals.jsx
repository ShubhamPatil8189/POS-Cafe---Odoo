import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Banknote, AlertTriangle } from 'lucide-react';

export function OpenSessionModal({ isOpen, onClose, onOpenSession }) {
  const [balance, setBalance] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!balance || isNaN(balance)) return;
    onOpenSession(parseFloat(balance));
    setBalance('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
              <h2 className="text-xl font-bold text-text-primary">Open Shift Dashboard</h2>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-surface-hover text-text-tertiary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Opening Cash Float (₹)</label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input 
                    type="number" 
                    autoFocus
                    placeholder="e.g. 5000"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-hover border border-border rounded-xl text-lg font-bold text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-2">Enter the physical cash amount currently in the register.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-text-secondary bg-surface-hover hover:bg-surface-active transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!balance} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-md shadow-primary-500/20">
                  Start Session
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CloseSessionModal({ isOpen, onClose, onCloseSession, sessionData }) {
  const [actualCash, setActualCash] = useState('');
  
  if (!sessionData) return null;

  const expectedCash = sessionData.openingBalance + sessionData.cashSales;
  const difference = parseFloat(actualCash || 0) - expectedCash;
  const isMatch = Math.abs(difference) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actualCash === '') return;
    onCloseSession({ actualCash: parseFloat(actualCash), difference });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50 bg-slate-50">
              <h2 className="text-xl font-black text-text-primary">Close Current Session</h2>
              <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-black/5 text-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-hover border border-border/50">
                  <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">Opening Cash</p>
                  <p className="text-xl font-bold text-text-primary">₹{sessionData.openingBalance.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-success-50 border border-success-200">
                  <p className="text-xs font-bold text-success-700 uppercase tracking-wider mb-1">Cash Sales</p>
                  <p className="text-xl font-bold text-success-800">+ ₹{sessionData.cashSales.toFixed(2)}</p>
                </div>
                <div className="col-span-2 p-4 rounded-2xl bg-primary-50 border border-primary-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">Expected Cash in Drawer</p>
                    <p className="text-3xl font-black text-primary-800">₹{expectedCash.toFixed(2)}</p>
                  </div>
                  <Banknote className="w-10 h-10 text-primary-300" />
                </div>
              </div>

              {/* Input for actual cash count */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Actual Cash Counted (₹)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      autoFocus
                      placeholder="Amount of physical cash"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="w-full pl-4 pr-4 py-4 bg-white border-2 border-border focus:border-primary-500 rounded-xl text-2xl font-black text-text-primary focus:ring-0 transition-all outline-none"
                    />
                  </div>
                </div>

                {actualCash !== '' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-xl flex items-center gap-3 ${isMatch ? 'bg-success-50 text-success-800' : 'bg-danger-50 text-danger-800'}`}
                  >
                    {isMatch ? <Check className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
                    <div>
                      <p className="font-bold">
                        {isMatch ? "Perfect Match!" : `Variance: ₹${Math.abs(difference).toFixed(2)}`}
                      </p>
                      <p className="text-sm opacity-80">
                        {isMatch ? "Drawer is exactly as expected." : difference > 0 ? "You have more cash than expected." : "You are short on cash."}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 py-4 px-4 rounded-xl font-bold text-text-secondary bg-surface-hover hover:bg-surface-active transition-colors">
                    Back to POS
                  </button>
                  <button type="submit" disabled={actualCash === ''} className="flex-1 py-4 px-4 rounded-xl font-bold text-white bg-black hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg shadow-black/20">
                    Confirm & Close
                  </button>
                </div>
              </form>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
