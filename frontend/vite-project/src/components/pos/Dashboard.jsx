import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, ChevronRight, Lock, DollarSign, CreditCard, Power } from 'lucide-react';

export default function Dashboard({ session, lastSessionInfo, onOpenSessionClick, onLockScreen }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col h-screen w-full bg-surface-base overflow-hidden relative font-sans text-text-primary">
      
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-primary-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="px-8 py-5 flex items-center justify-between z-10 bg-white/50 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
            <span className="text-white font-black text-xl">O</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">Odoo Cafe POS</h1>
            <p className="text-xs font-semibold text-text-secondary mt-1">Terminal 1 • Main Counter</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xl font-black tabular-nums tracking-tight">{formattedTime}</span>
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover rounded-full border border-border">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 shadow-sm" />
            <span className="text-sm font-bold pr-2">Jane Doe</span>
          </div>
          <button onClick={onLockScreen} className="p-2.5 rounded-full bg-white border border-border shadow-sm hover:bg-surface-hover transition-colors text-text-secondary">
             <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        
        {session.status === 'open' ? (
           <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
             className="flex flex-col flex-1 w-full"
           >
              {/* Should not happen typically if activeView redirects correctly, but fallback */}
              <div className="text-center mt-20">
                <CheckCircle2 className="w-20 h-20 text-success-500 mx-auto mb-6" />
                <h2 className="text-4xl font-black mb-2">Session is Active</h2>
                <p className="text-text-secondary">Terminal is ready for processing orders.</p>
              </div>
           </motion.div>
        ) : (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
             className="w-full max-w-2xl"
           >
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-4 bg-danger-50 text-danger-600 rounded-full mb-6 ring-8 ring-danger-50/50">
                   <Power className="w-10 h-10" strokeWidth={2.5} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Terminal Closed</h2>
                <p className="text-lg text-text-secondary">Open a new session to begin taking orders and processing payments.</p>
              </div>

              {/* Last Session Stats Widget */}
              {lastSessionInfo && (
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-border/60 mb-10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                  <div className="flex justify-between items-start mb-6 border-b border-border-light pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-1">Previous Session Overview</h3>
                      <p className="text-sm font-medium text-text-primary">Closed on {new Date(lastSessionInfo.endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <span className="px-3 py-1 bg-surface-hover rounded-full text-xs font-bold text-text-secondary">
                      ₹{lastSessionInfo.difference > 0 ? '+' : ''}{lastSessionInfo.difference.toFixed(2)} Variance
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-2 text-text-secondary mb-1">
                         <DollarSign className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                      </div>
                      <p className="text-3xl font-black tabular-nums">₹{lastSessionInfo.totalSales.toFixed(2)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-text-secondary mb-1">
                         <CreditCard className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Closing Cash</span>
                      </div>
                      <p className="text-3xl font-black tabular-nums text-primary-700">₹{lastSessionInfo.closingBalance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Big CTA */}
              <button 
                onClick={onOpenSessionClick}
                className="w-full relative group overflow-hidden bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] p-8 shadow-xl shadow-primary-600/30 transition-transform hover:scale-[1.02] active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-[2rem]" />
                <div className="relative z-10 flex items-center justify-center gap-4">
                  <span className="text-2xl font-black tracking-widest uppercase">Open Session</span>
                  <ChevronRight className="w-8 h-8 opacity-80" />
                </div>
              </button>

           </motion.div>
        )}
      </main>

    </div>
  );
}
