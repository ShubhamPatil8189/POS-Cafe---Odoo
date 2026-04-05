import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import { Sparkles, Trophy, RefreshCcw, ArrowRight, Gift, Star } from 'lucide-react';
import Confetti from '../components/ui/Confetti';

const REWARDS = [
  { id: 0, text: 'Free Brownie 🍫', color: '#FF6B35', bgColor: '#FF6B35', icon: '🍫', probability: 0.2 },
  { id: 1, text: 'Ice Cream 🍨', color: '#FF1493', bgColor: '#FF1493', icon: '🍨', probability: 0.2 },
  { id: 2, text: 'Lassi 🥤', color: '#00CED1', bgColor: '#00CED1', icon: '🥤', probability: 0.1 },
  { id: 3, text: '10% Discount 💸', color: '#FFD700', bgColor: '#FFD700', icon: '💸', probability: 0.3 },
  { id: 4, text: 'Buy 1 Get 1 🍔', color: '#32CD32', bgColor: '#32CD32', icon: '🍔', probability: 0.1 },
  { id: 5, text: 'Better Luck Next Time', color: '#9E9E9E', bgColor: '#9E9E9E', icon: '😅', probability: 0.1 },
];

export default function RewardSpinWheel({ onNavigate, orderId: propOrderId }) {
  const { orderId: paramsOrderId } = useParams();
  const orderId = paramsOrderId || propOrderId || 'REWARD';

  const [stage, setStage] = useState('preparing');
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResultCard, setShowResultCard] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setStage('ready'), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.location.href = '/';
    }
  };

  const spinRotation = useMotionValue(0);

  const handleSpin = () => {
    if (stage !== 'ready') return;

    setStage('spinning');

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * REWARDS.length);
      const targetReward = REWARDS[randomIndex];

      const segmentAngle = 360 / REWARDS.length;
      const finalRotation = 1800 + (360 - (randomIndex * segmentAngle)) - (segmentAngle / 2);

      animate(spinRotation, finalRotation, {
        duration: 5,
        ease: [0.12, 0.8, 0.15, 1],
        onUpdate: (latest) => setRotation(latest),
        onComplete: () => {
          setStage('won');
          setResult(targetReward);
          if (targetReward.id !== 5) {
            setShowConfetti(true);
          }
          setShowResultCard(true);
        }
      });
    }, 500);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 font-sans">

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="grid grid-cols-6 gap-4 p-8">
          {['🍕', '🍔', '🍟', '🌭', '🍦', '🍩', '☕', '🥤', '🍿', '🥗', '🍝', '🍣'].map((food, i) => (
            <div key={i} className="text-4xl">{food}</div>
          ))}
        </div>
      </div>

      <Confetti active={showConfetti} />

      {/* Preparing Overlay */}
      <AnimatePresence>
        {stage === 'preparing' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-pink-500"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-24 h-24 rounded-full border-4 border-white/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl animate-bounce">🎁</div>
              </div>
            </div>
            <motion.p className="mt-8 text-xl font-bold text-white">
              Preparing Your Surprise!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={stage !== 'preparing' ? { opacity: 1, y: 0 } : {}}
        className="relative z-10 text-center mb-8 px-4"
      >
        <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
          🎁 Exclusive Reward
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase leading-none">
          SPIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">&</span> WIN
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">
          Unlock your culinary surprise
        </p>
      </motion.div>

      {/* The Wheel - FIXED VISIBILITY */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={stage !== 'preparing' ? { opacity: 1, scale: 1 } : {}}
        className="relative z-10 w-[350px] h-[350px] md:w-[500px] md:h-[500px] mb-16"
      >
        {/* Selector Arrow */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30">
          <div className="relative">
            <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[50px] border-t-yellow-400 filter drop-shadow-2xl" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>

        {/* Wheel Container */}
        <motion.div className="w-full h-full rounded-full shadow-2xl overflow-hidden border-8 border-white" style={{ rotate: spinRotation }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {REWARDS.map((reward, i) => {
              const startAngle = (i * 360) / REWARDS.length;
              const endAngle = ((i + 1) * 360) / REWARDS.length;

              // Calculate path
              const startRad = (startAngle - 90) * Math.PI / 180;
              const endRad = (endAngle - 90) * Math.PI / 180;

              const x1 = 50 + 50 * Math.cos(startRad);
              const y1 = 50 + 50 * Math.sin(startRad);
              const x2 = 50 + 50 * Math.cos(endRad);
              const y2 = 50 + 50 * Math.sin(endRad);

              const largeArc = endAngle - startAngle > 180 ? 1 : 0;

              return (
                <g key={reward.id}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={reward.bgColor}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  {/* Text on segment */}
                  <text
                    x="50"
                    y="50"
                    fill="white"
                    fontSize="4"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${startAngle + (360 / REWARDS.length) / 2}, 50, 50) translate(0, -35)`}
                  >
                    {reward.icon}
                  </text>
                  <text
                    x="50"
                    y="50"
                    fill="white"
                    fontSize="3"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${startAngle + (360 / REWARDS.length) / 2}, 50, 50) translate(0, -25)`}
                  >
                    {reward.text.split(' ')[0]}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="50" cy="50" r="12" fill="white" stroke="#333" strokeWidth="2" />
            <circle cx="50" cy="50" r="6" fill="#FF6B35" />
          </svg>
        </motion.div>

        {/* Spin Button */}
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSpin}
            disabled={stage !== 'ready'}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 font-black text-white uppercase pointer-events-auto shadow-2xl transition-all duration-500 ${stage === 'spinning' ? 'bg-gray-600 cursor-not-allowed' :
                stage === 'won' ? 'bg-green-600' :
                  'bg-gradient-to-br from-orange-500 to-pink-500 hover:shadow-[0_0_30px_rgba(255,107,53,0.5)] animate-pulse'
              }`}
          >
            {stage === 'spinning' ? (
              <>
                <RefreshCcw className="w-6 h-6 animate-spin" />
                <span className="text-[10px]">SPINNING</span>
              </>
            ) : stage === 'won' ? (
              <>
                <Trophy className="w-8 h-8" />
                <span className="text-[10px]">WON!</span>
              </>
            ) : (
              <>
                <span className="text-[10px]">SPIN</span>
                <Sparkles className="w-6 h-6" />
                <span className="text-[8px]">TO WIN</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Food Items Showcase */}
      <div className="relative z-10 flex gap-3 mb-8">
        {['🍕', '🍔', '🍦', '☕', '🍩', '🥤'].map((food, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.2 }}
            className="text-2xl bg-white/10 backdrop-blur rounded-full p-2 shadow-lg cursor-pointer"
          >
            {food}
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <div className="relative z-10 text-center">
        <p className="text-gray-400 text-xs">
          Click the SPIN button to win exciting rewards!
        </p>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultCard && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowResultCard(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.id === 5 ? 'bg-gray-100' : 'bg-gradient-to-br from-orange-500 to-pink-500'
                }`}>
                <div className="text-5xl">{result.id === 5 ? '😅' : result.icon}</div>
              </div>

              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                {result.id === 5 ? 'Better Luck Next Time' : 'Congratulations!'}
              </h3>

              <h2 className={`text-2xl font-black mb-4 ${result.id === 5 ? 'text-gray-600' : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500'}`}>
                {result.text}
              </h2>

              <div className="h-px w-full bg-gray-200 my-6" />

              <p className="text-gray-500 text-sm mb-6">
                {result.id === 5
                  ? "Don't worry! Order again for another chance to win!"
                  : `Show this screen to our staff to redeem your reward! Code: ${orderId?.slice(-6)?.toUpperCase() || 'REWARD'}`}
              </p>

              <button
                onClick={handleBack}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Back to Restaurant
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}