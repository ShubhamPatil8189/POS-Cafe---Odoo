import React from 'react';
import { motion } from 'framer-motion';

export default function TableCard({ table, onClick }) {
  // Ultra-Premium Color schemes with modern gradients
  const getColors = () => {
    switch (table.status || table.state) {
      case 'occupied':
        return {
          tableBg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
          tableBorder: 'border-amber-400',
          tableShadow: 'shadow-amber-500/40',
          chairBg: 'bg-gradient-to-br from-amber-300 to-amber-500',
          chairBorder: 'border-amber-400',
          textColor: 'text-white',
          statusBg: 'bg-amber-500/20',
          statusText: 'text-amber-100',
          statusBorder: 'border-amber-400/30',
          glow: 'shadow-amber-400/50',
          dotColor: 'bg-amber-300',
          icon: '🍽️',
          gradient: 'from-amber-500 to-orange-500',
          ambient: 'from-amber-500/20 via-orange-500/10 to-transparent',
          cardBg: 'from-amber-50/30 via-orange-50/20 to-transparent',
          cardBorder: 'border-amber-200/20'
        };
      case 'reserved':
        return {
          tableBg: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600',
          tableBorder: 'border-emerald-400',
          tableShadow: 'shadow-emerald-500/40',
          chairBg: 'bg-gradient-to-br from-emerald-300 to-emerald-500',
          chairBorder: 'border-emerald-400',
          textColor: 'text-white',
          statusBg: 'bg-emerald-500/20',
          statusText: 'text-emerald-100',
          statusBorder: 'border-emerald-400/30',
          glow: 'shadow-emerald-400/50',
          dotColor: 'bg-emerald-300',
          icon: '📅',
          gradient: 'from-emerald-500 to-teal-500',
          ambient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
          cardBg: 'from-emerald-50/30 via-teal-50/20 to-transparent',
          cardBorder: 'border-emerald-200/20'
        };
      case 'preparing':
        return {
          tableBg: 'bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600',
          tableBorder: 'border-indigo-400',
          tableShadow: 'shadow-indigo-500/40',
          chairBg: 'bg-gradient-to-br from-indigo-300 to-indigo-500',
          chairBorder: 'border-indigo-400',
          textColor: 'text-white',
          statusBg: 'bg-indigo-500/20',
          statusText: 'text-indigo-100',
          statusBorder: 'border-indigo-400/30',
          glow: 'shadow-indigo-400/50',
          dotColor: 'bg-indigo-300',
          icon: '👨‍🍳',
          gradient: 'from-indigo-500 to-purple-500',
          ambient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
          cardBg: 'from-indigo-50/30 via-purple-50/20 to-transparent',
          cardBorder: 'border-indigo-200/20'
        };
      case 'blocked':
        return {
          tableBg: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800',
          tableBorder: 'border-slate-500',
          tableShadow: 'shadow-slate-600/40',
          chairBg: 'bg-gradient-to-br from-slate-500 to-slate-700',
          chairBorder: 'border-slate-600',
          textColor: 'text-slate-200',
          statusBg: 'bg-red-500/20',
          statusText: 'text-red-200',
          statusBorder: 'border-red-400/30',
          glow: 'shadow-slate-500/30',
          dotColor: 'bg-red-500',
          icon: '🚫',
          gradient: 'from-slate-600 to-gray-700',
          ambient: 'from-red-500/20 via-slate-600/10 to-transparent',
          cardBg: 'from-slate-800/30 via-gray-800/20 to-transparent',
          cardBorder: 'border-slate-600/20'
        };
      default: // available
        return {
          tableBg: 'bg-gradient-to-br from-white via-slate-50 to-slate-100',
          tableBorder: 'border-slate-200',
          tableShadow: 'shadow-slate-300/30',
          chairBg: 'bg-gradient-to-br from-slate-200 to-slate-300',
          chairBorder: 'border-slate-300',
          textColor: 'text-slate-700',
          statusBg: 'bg-slate-100',
          statusText: 'text-slate-600',
          statusBorder: 'border-slate-200',
          glow: 'shadow-slate-200/50',
          dotColor: 'bg-emerald-500',
          icon: '✨',
          gradient: 'from-slate-100 to-gray-50',
          ambient: 'from-emerald-500/10 via-blue-500/5 to-transparent',
          cardBg: 'from-white/40 via-slate-50/30 to-transparent',
          cardBorder: 'border-slate-200/30'
        };
    }
  };

  const colors = getColors();

  // Elegant table dimensions
  const getTableConfig = () => {
    const isRound = table.table_type === 'round';
    if (table.seats <= 2) return { width: 'w-24', height: 'h-24', rounded: isRound ? 'rounded-full' : 'rounded-2xl', text: 'text-3xl' };
    if (table.seats <= 4) return { width: 'w-32', height: 'h-32', rounded: isRound ? 'rounded-full' : 'rounded-2xl', text: 'text-4xl' };
    if (table.seats <= 6) return { width: 'w-40', height: 'h-32', rounded: isRound ? 'rounded-3xl' : 'rounded-2xl', text: 'text-4xl' };
    return { width: 'w-48', height: 'h-36', rounded: isRound ? 'rounded-full' : 'rounded-2xl', text: 'text-5xl' };
  };

  const config = getTableConfig();

  // Restaurant decorative elements
  const renderRestaurantDecor = () => {
    return (
      <>
        {/* Hanging pendant lights */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`light-${i}`}
            animate={{
              rotate: [0, 2, -2, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
            className="absolute pointer-events-none"
            style={{
              top: `${-25 + (i * 25)}px`,
              left: `${15 + (i * 35)}%`,
              zIndex: 1
            }}
          >
            <div className="relative">
              <div className="w-0.5 h-6 bg-gradient-to-b from-amber-400/40 to-transparent" />
              <div className="w-4 h-4 rounded-full bg-amber-400/20 blur-sm" />
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-amber-300/40 animate-pulse" />
            </div>
          </motion.div>
        ))}

        {/* Floating sparkles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.4, 0],
              scale: [0, 1, 0],
              y: [0, -20, -40]
            }}
            transition={{
              duration: 2 + (i * 0.3),
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut"
            }}
            className="absolute w-0.5 h-0.5 rounded-full bg-amber-300/40 pointer-events-none"
            style={{
              left: `${20 + (i * 12)}%`,
              top: `${30 + (i * 10)}%`,
              zIndex: 1
            }}
          />
        ))}
      </>
    );
  };

  // Enhanced chairs
  const renderChairs = () => {
    const chairs = [];
    const seats = table.seats;
    const isRound = table.table_type === 'round';

    if (isRound) {
      for (let i = 0; i < seats; i++) {
        const angle = (i * 360) / seats;
        const radius = table.seats > 4 ? 75 : 65;
        chairs.push(
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: angle }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
            className={`absolute ${colors.chairBg} ${colors.chairBorder} border-2 shadow-xl transition-all duration-300 hover:scale-110 hover:z-20`}
            style={{
              width: '28px',
              height: '18px',
              borderRadius: '10px 10px 6px 6px',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`,
              zIndex: 15,
              boxShadow: '0 8px 15px -6px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="w-full h-2 rounded-t-lg bg-white/30" />
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </motion.div>
        );
      }
    } else {
      let top = 0, bottom = 0, left = 0, right = 0;
      if (seats <= 2) { top = 1; bottom = 1; }
      else if (seats <= 4) { top = 1; bottom = 1; left = 1; right = 1; }
      else if (seats <= 6) { top = 2; bottom = 2; left = 1; right = 1; }
      else { top = 3; bottom = 3; left = 2; right = 2; }

      for (let i = 0; i < top; i++) {
        const offset = top > 1 ? -35 + (i * 70) : 0;
        chairs.push(
          <motion.div
            key={`t-${i}`}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className={`absolute top-[-26px] left-[calc(50%+${offset}px-14px)] w-7 h-6 ${colors.chairBg} ${colors.chairBorder} border-2 rounded-t-xl shadow-xl`}
            style={{ zIndex: 15 }}
          >
            <div className="w-full h-2.5 rounded-t-xl bg-white/30" />
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </motion.div>
        );
        chairs.push(
          <motion.div
            key={`b-${i}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className={`absolute bottom-[-26px] left-[calc(50%+${offset}px-14px)] w-7 h-6 ${colors.chairBg} ${colors.chairBorder} border-2 rounded-b-xl shadow-xl`}
            style={{ zIndex: 15 }}
          >
            <div className="w-full h-2.5 rounded-b-xl bg-white/30" />
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </motion.div>
        );
      }

      for (let i = 0; i < left; i++) {
        const offset = left > 1 ? -30 + (i * 60) : 0;
        chairs.push(
          <motion.div
            key={`l-${i}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className={`absolute left-[-26px] top-[calc(50%+${offset}px-12px)] w-6 h-7 ${colors.chairBg} ${colors.chairBorder} border-2 rounded-l-xl shadow-xl`}
            style={{ zIndex: 15 }}
          >
            <div className="w-2.5 h-full rounded-l-xl bg-white/30" />
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </motion.div>
        );
        chairs.push(
          <motion.div
            key={`r-${i}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className={`absolute right-[-26px] top-[calc(50%+${offset}px-12px)] w-6 h-7 ${colors.chairBg} ${colors.chairBorder} border-2 rounded-r-xl shadow-xl`}
            style={{ zIndex: 15 }}
          >
            <div className="w-2.5 h-full rounded-r-xl bg-white/30" />
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </motion.div>
        );
      }
    }
    return chairs;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative flex flex-col items-center justify-center p-10 transition-all duration-500 overflow-visible"
    >
      {/* BACKGROUND CARD - Behind everything */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`absolute inset-0 bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm rounded-3xl border ${colors.cardBorder} shadow-xl overflow-hidden`}
        style={{ zIndex: 0 }}
      >
        {/* Card texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwIDBMNjAgMzAgMzAgNjAgMCAzMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] opacity-10" />

        {/* Card ambient glow */}
        <div className={`absolute inset-0 bg-gradient-to-t ${colors.ambient} opacity-20`} />

        {/* Card decorative border */}
        <div className="absolute inset-3 rounded-2xl border border-white/10" />

        {/* Card corner accents */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t border-l border-white/20 rounded-tl-xl" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b border-r border-white/20 rounded-br-xl" />
      </motion.div>

      {/* Restaurant atmosphere decorations */}
      {renderRestaurantDecor()}

      {/* Main Content Container */}
      <div className="relative group overflow-visible" style={{ zIndex: 10 }}>

        {/* Ambient glow behind table */}
        <motion.div
          animate={table.status === 'occupied' ? {
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.3, 0.15]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
          className={`absolute -inset-6 ${colors.glow} blur-2xl rounded-full opacity-15 group-hover:opacity-25 transition-opacity duration-500`}
          style={{ zIndex: 5 }}
        />

        {/* Table and Chairs Container */}
        <div
          onClick={() => onClick(table)}
          className="relative cursor-pointer overflow-visible"
          style={{ zIndex: 20 }}
        >
          {/* Chairs - behind table but on top of background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {renderChairs()}
          </div>

          {/* Premium Table Surface */}
          <motion.div
            whileHover={{ rotate: 0.5 }}
            className={`relative ${config.width} ${config.height} ${config.rounded} ${colors.tableBg} border-2 ${colors.tableBorder} shadow-2xl overflow-hidden transition-all duration-500`}
            style={{ zIndex: 20, position: 'relative' }}
          >
            {/* Animated gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            {/* Crystal glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5" />

            {/* Shimmer sweep */}
            <motion.div
              animate={{ x: ['-150%', '150%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: Math.random() * 3 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            />

            {/* Premium texture */}
            <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwIDBMNjAgMzAgMzAgNjAgMCAzMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-repeat" />

            {/* Inner glow ring */}
            <div className={`absolute inset-1 ${config.rounded} ring-1 ring-white/20`} />

            {/* Premium corner ornaments */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-xl" />

            {/* Table Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-2">
              <motion.div
                animate={{
                  y: [0, -2, 0],
                  rotate: [0, 3, -3, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-lg mb-0.5 drop-shadow-lg"
              >
                {colors.icon}
              </motion.div>

              <span className={`text-[7px] font-black tracking-[0.2em] ${colors.textColor}/60 uppercase`}>
                Table
              </span>

              <h3 className={`${config.text} font-black ${colors.textColor} tracking-tight -mt-0.5 drop-shadow-lg`}>
                {table.table_number || table.number}
              </h3>

              <div className={`flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full ${colors.statusBg} backdrop-blur-sm border ${colors.statusBorder}`}>
                <svg className="w-2.5 h-2.5 text-current" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className={`text-[9px] font-bold ${colors.textColor}`}>{table.seats}</span>
              </div>
            </div>

            {/* Holographic effect */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
            />
          </motion.div>

          {/* Status Badge */}
          <div className="absolute -bottom-12 left-0 right-0 flex flex-col items-center z-30">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.statusBg} backdrop-blur-md shadow-lg border ${colors.statusBorder}`}
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${colors.dotColor} shadow-lg`}
              />
              <span className={`text-[9px] font-black uppercase tracking-widest ${colors.statusText}`}>
                {table.status || table.state}
              </span>
            </motion.div>
          </div>

          {/* Blocked overlay */}
          {(table.status === 'blocked' || table.state === 'blocked') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center z-30"
            >
              <div className="bg-red-500/90 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xl">
                🚫 BLOCKED
              </div>
            </motion.div>
          )}
        </div>

        {/* Floor shadow */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-3/4 h-2 bg-black/5 rounded-full blur-md pointer-events-none" style={{ zIndex: 1 }} />
      </div>
    </motion.div>
  );
}