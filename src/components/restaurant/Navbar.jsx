import React from 'react';
import { motion } from 'framer-motion';
import { useOrders } from './OrderContext';

function KitchenPotIcon({ pulse, glow }) {
  return (
    <div
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-shadow duration-500 ${
        glow ? 'shadow-glow ring-2 ring-accent-400/50' : ''
      }`}
    >
      <div
        className={`pointer-events-none absolute -top-0.5 left-1/2 flex -translate-x-1/2 gap-0.5 ${
          pulse ? 'steam-wrap steam-wrap--intense' : 'steam-wrap'
        }`}
      >
        <span className="steam steam-1" />
        <span className="steam steam-2" />
        <span className="steam steam-3" />
      </div>

      <svg
        viewBox="0 0 64 64"
        className="relative z-10 h-9 w-9"
        aria-hidden
      >
        <defs>
          <linearGradient id="potGradPos" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#552490" />
          </linearGradient>
          <linearGradient id="lidGradPos" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#6a2db4" />
          </linearGradient>
        </defs>
        <path
          d="M12 28c0-8 8-14 20-14s20 6 20 14v18c0 6-8 10-20 10S12 52 12 46V28z"
          fill="url(#potGradPos)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
        />
        <ellipse cx="32" cy="28" rx="19" ry="5" fill="rgba(255,255,255,0.15)" />
        <path
          d="M10 32c-3 0-5 2-5 5v6c0 2 2 4 4 4"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M54 32c3 0 5 2 5 5v6c0 2-2 4-4 4"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <motion.g
          style={{ transformOrigin: '32px 22px' }}
          animate={
            pulse
              ? { rotate: [0, -7, 7, -5, 5, -3, 3, 0] }
              : { rotate: 0 }
          }
          transition={{
            duration: 0.65,
            ease: 'easeInOut',
            repeat: pulse ? 2 : 0,
          }}
        >
          <ellipse
            cx="32"
            cy="22"
            rx="21"
            ry="7"
            fill="url(#lidGradPos)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
          />
          <circle cx="32" cy="18" r="3" fill="rgba(255,255,255,0.9)" />
        </motion.g>
      </svg>
    </div>
  );
}

/**
 * Secondary POS nav — matches existing white / primary Café POS chrome.
 */
export default function Navbar({ currentView, onViewChange }) {
  const { kitchenPulse, kitchenGlow } = useOrders();

  const tab = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => onViewChange(id)}
      className={`relative shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
        currentView === id
          ? 'text-primary-800'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {currentView === id && (
        <motion.span
          layoutId="pos-subnav-pill"
          className="absolute inset-0 rounded-xl bg-primary-50 ring-1 ring-primary-200/80"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-white/90 px-4 shadow-sm backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-black text-text-primary md:text-base">
          Café POS
        </span>
        <span className="hidden text-text-tertiary sm:inline">·</span>
        <span className="hidden text-xs font-semibold uppercase tracking-wider text-text-tertiary sm:inline">
          Service
        </span>
      </div>

      <nav className="flex max-w-[min(100%,28rem)] items-center gap-0.5 overflow-x-auto rounded-2xl bg-surface-hover/80 p-1 ring-1 ring-border sm:max-w-none">
        {tab('tables', 'Tables')}
        {tab('menu', 'Menu')}
        {tab('orders', 'Orders')}
        {tab('kitchen', 'Kitchen')}
      </nav>

      <button
        type="button"
        onClick={() => onViewChange('kitchen')}
        className="shrink-0 rounded-xl p-0.5 ring-1 ring-transparent transition hover:bg-surface-hover hover:ring-border"
        title="Kitchen display"
      >
        <KitchenPotIcon pulse={kitchenPulse} glow={kitchenGlow} />
      </button>
    </header>
  );
}
