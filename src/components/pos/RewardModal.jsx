import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import { Sparkles, Trophy, Gift, Star, ArrowRight, X, RefreshCcw, Coffee, Cake, Sandwich, IceCream, Pizza, Coffee as CoffeeIcon } from 'lucide-react';
import Confetti from '../ui/Confetti';

// 8 Delicious Cafe Rewards
const REWARDS = [
  { id: 0, text: 'Premium Coffee ☕', color: '#8B4513', icon: '☕', fullText: 'Premium Coffee', gradient: 'from-amber-600 to-brown-600' },
  { id: 1, text: 'Croissant 🥐', color: '#D2691E', icon: '🥐', fullText: 'Butter Croissant', gradient: 'from-amber-500 to-orange-500' },
  { id: 2, text: 'Cheesecake 🍰', color: '#F4A460', icon: '🍰', fullText: 'New York Cheesecake', gradient: 'from-amber-400 to-orange-400' },
  { id: 3, text: 'Cold Coffee 🧋', color: '#6B3E26', icon: '🧋', fullText: 'Iced Latte', gradient: 'from-amber-700 to-brown-700' },
  { id: 4, text: 'Sandwich 🥪', color: '#DAA520', icon: '🥪', fullText: 'Grilled Sandwich', gradient: 'from-amber-500 to-yellow-500' },
  { id: 5, text: 'Muffin 🧁', color: '#CD853F', icon: '🧁', fullText: 'Choco Muffin', gradient: 'from-amber-400 to-pink-400' },
  { id: 6, text: 'Brownie 🍫', color: '#8B4513', icon: '🍫', fullText: 'Walnut Brownie', gradient: 'from-amber-800 to-brown-800' },
  { id: 7, text: 'Tea 🍵', color: '#556B2F', icon: '🍵', fullText: 'Masala Chai', gradient: 'from-amber-600 to-green-600' },
];

export default function RewardModal({ isOpen, onClose, onFinish, orderId }) {
  const [stage, setStage] = useState('ready');
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const spinRotation = useMotionValue(0);

  const handleSpin = () => {
    if (stage !== 'ready') return;
    setStage('spinning');

    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    const targetReward = REWARDS[randomIndex];

    const segmentAngle = 360 / REWARDS.length;
    const finalRotation = 1800 + (360 - (randomIndex * segmentAngle)) - (segmentAngle / 2);

    animate(spinRotation, finalRotation, {
      duration: 5,
      ease: [0.12, 0.8, 0.15, 1],
      onComplete: () => {
        setResult(targetReward);
        setStage('won');
        setShowConfetti(true);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <Confetti active={showConfetti} />

        {/* Main Modal Container */}
        <motion.div
          initial={{ scale: 0.9, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl overflow-hidden shadow-2xl"
        >

          {/* Background Coffee Pattern */}
          <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="grid grid-cols-6 gap-8 p-12">
                {['☕', '🥐', '🍰', '🧋', '🥪', '🧁', '🍫', '🍵', '☕', '🥐', '🍰', '🧋'].map((item, i) => (
                  <div key={i} className="text-5xl animate-float" style={{ animationDelay: `${i * 0.1}s` }}>{item}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative Coffee Beans */}
          <div className="absolute top-10 right-10 w-20 h-20 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="40" fill="#8B4513" />
              <path d="M50 10 Q60 30 50 50 Q40 30 50 10" fill="#D2691E" />
            </svg>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/90 hover:bg-white text-amber-600 shadow-lg transition-all hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col lg:flex-row">

            {/* Left Side - Wheel Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-10">

              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-[0.2em] mb-4 shadow-lg"
                >
                  <CoffeeIcon className="w-4 h-4" />
                  Cafe Rewards Program
                </motion.div>
                <h2 className="text-4xl lg:text-5xl font-black text-amber-900 uppercase tracking-tighter">
                  SPIN &
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600"> WIN</span>
                </h2>
                <p className="text-amber-600 text-sm mt-2 font-medium">Spin the wheel to unlock delicious rewards!</p>
              </div>

              {/* The Wheel */}
              <div className="relative w-[300px] h-[300px] lg:w-[420px] lg:h-[420px] my-6">

                {/* Glow Effect */}
                <div className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-amber-300/20 to-orange-300/20 blur-2xl" />

                {/* Selector Arrow */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
                  <div className="relative">
                    <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[45px] border-t-amber-600 filter drop-shadow-2xl" />
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-amber-500 shadow-lg" />
                  </div>
                </div>

                {/* Wheel SVG */}
                <motion.div
                  className="w-full h-full cursor-pointer rounded-full shadow-2xl overflow-hidden"
                  style={{ rotate: spinRotation }}
                  onClick={stage === 'ready' ? handleSpin : undefined}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {REWARDS.map((reward, i) => {
                      const startAngle = (i * 360) / REWARDS.length;
                      const endAngle = ((i + 1) * 360) / REWARDS.length;

                      const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                      const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                      const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                      const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                      return (
                        <g key={reward.id}>
                          <path
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                            fill={reward.color}
                            fillOpacity={0.85}
                            stroke="white"
                            strokeWidth="1.5"
                          />
                          <text
                            x="72" y="50"
                            fontSize="7"
                            fontWeight="bold"
                            transform={`rotate(${startAngle + (360 / REWARDS.length) / 2}, 50, 50)`}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {reward.icon}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeOpacity={0.6} strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="16" fill="white" stroke="#F59E0B" strokeWidth="3" />
                    <circle cx="50" cy="50" r="7" fill="#F59E0B" />
                    <circle cx="50" cy="50" r="3" fill="white" />
                  </svg>
                </motion.div>

                {/* Spin Button Overlay */}
                {stage === 'ready' && (
                  <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <motion.button
                      whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(245, 158, 11, 0.5)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSpin}
                      className="w-24 h-24 lg:w-32 lg:h-32 rounded-full flex flex-col items-center justify-center gap-1 font-black text-white uppercase pointer-events-auto border-4 border-white shadow-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:shadow-orange-500/50 transition-all"
                    >
                      <span className="text-[11px] lg:text-xs tracking-tighter">SPIN</span>
                      <Sparkles className="w-7 h-7 lg:w-9 lg:h-9" />
                      <span className="text-[9px] lg:text-[10px] opacity-90">TO WIN</span>
                    </motion.button>
                  </div>
                )}

                {/* Spinning Indicator */}
                {stage === 'spinning' && (
                  <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-white/95 backdrop-blur flex flex-col items-center justify-center border-4 border-amber-500 shadow-2xl">
                      <RefreshCcw className="w-10 h-10 lg:w-12 lg:h-12 text-amber-600 animate-spin" />
                      <span className="text-[10px] lg:text-xs text-amber-700 font-bold mt-1">SPINNING</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {stage === 'ready' && (
                <p className="text-amber-600/70 text-xs mt-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Tap the wheel or center button to spin!
                  <Sparkles className="w-3 h-3" />
                </p>
              )}
            </div>

            {/* Right Side - Cafe Decor & Info */}
            <div className="w-full lg:w-96 bg-gradient-to-br from-amber-800 to-orange-800 p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent" />

              {/* Cafe Image */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mb-6"
              >
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-white/10 backdrop-blur flex items-center justify-center overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200&h=200&fit=crop"
                      alt="Cafe"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
              </motion.div>

              <h3 className="text-white text-2xl font-black mb-2">Cafe Delights</h3>
              <p className="text-amber-200 text-sm mb-6">Win exclusive treats & beverages</p>

              {/* Reward Highlights */}
              <div className="space-y-3 w-full mb-6">
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur">
                  <span className="text-amber-200 text-sm">☕ Premium Coffee</span>
                  <span className="text-white font-bold">Free</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur">
                  <span className="text-amber-200 text-sm">🍰 Cheesecake</span>
                  <span className="text-white font-bold">50% OFF</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur">
                  <span className="text-amber-200 text-sm">🥐 Croissant</span>
                  <span className="text-white font-bold">Buy 1 Get 1</span>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 w-full">
                <p className="text-amber-200 text-[10px] uppercase tracking-wider">Order Number</p>
                <p className="text-white font-bold text-sm">{orderId || 'CAFE-2024'}</p>
              </div>
            </div>
          </div>

          {/* Winner Display - Full Width Modal */}
          <AnimatePresence>
            {stage === 'won' && result && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute inset-0 z-50 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center rounded-3xl"
              >
                <div className="text-center p-8 max-w-md">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="text-8xl mb-6 animate-bounce"
                  >
                    {result.icon}
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                  >
                    <Trophy className="w-4 h-4" />
                    Congratulations!
                  </motion.div>
                  <h3 className="text-3xl font-black text-amber-900 mb-2">
                    You Won!
                  </h3>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-6">
                    {result.fullText}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        onFinish && onFinish();
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black uppercase text-sm tracking-wider shadow-xl hover:scale-[1.02] transition-transform"
                    >
                      Claim Your Reward
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={onClose}
                      className="text-amber-600 text-sm hover:text-amber-700 transition"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .animate-bounce {
            animation: bounce 0.6s ease-in-out infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}