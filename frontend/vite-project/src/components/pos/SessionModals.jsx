import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Banknote, AlertTriangle, TrendingUp, TrendingDown, Clock, Shield, Sparkles, Calculator } from 'lucide-react';

// Animation variants for better orchestration
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { staggerChildren: 0.02, staggerDirection: -1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } },
  exit: { opacity: 0, y: -10 }
};

const inputVariants = {
  focus: { scale: 1.02, boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)" },
  blur: { scale: 1, boxShadow: "none" }
};

export function OpenSessionModal({ isOpen, onClose, onOpenSession }) {
  const [balance, setBalance] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!balance || isNaN(balance)) return;
    onOpenSession(parseFloat(balance));
    setBalance('');
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md relative"
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
              animate={{ opacity: isHovered ? 0.7 : 0 }}
              transition={{ duration: 0.3 }}
            />

            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <Sparkles className="w-6 h-6 text-primary-600" />
                      </motion.div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
                        Open Shift Dashboard
                      </h2>
                    </div>
                    <motion.button
                      onClick={onClose}
                      className="p-2 -mr-2 rounded-full hover:bg-white/50 text-gray-500 hover:text-gray-700 transition-all duration-200"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-9">Start your work shift with initial cash balance</p>
                </div>
              </div>

              <motion.form
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleSubmit}
                className="p-6 space-y-6"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary-600" />
                    Opening Cash Float
                  </label>
                  <motion.div
                    className="relative"
                    animate={isFocused ? "focus" : "blur"}
                    variants={inputVariants}
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <span className="text-2xl font-bold text-gray-400">₹</span>
                    </div>
                    <input
                      type="number"
                      autoFocus
                      placeholder="Enter amount"
                      value={balance}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 focus:border-primary-500 rounded-2xl text-2xl font-bold text-gray-900 focus:ring-0 transition-all outline-none"
                    />
                    <motion.div
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: balance ? 1 : 0 }}
                    >
                      <Calculator className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                  <motion.p
                    className="text-xs text-gray-500 mt-2 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Shield className="w-3 h-3" />
                    Enter the physical cash amount in the register
                  </motion.p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 px-4 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={!balance}
                    className="flex-1 py-4 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-primary-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.span
                      initial={{ x: 0 }}
                      animate={{ x: !balance ? 0 : [0, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      Start Session
                    </motion.span>
                  </motion.button>
                </motion.div>
              </motion.form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CloseSessionModal({ isOpen, onClose, onCloseSession, sessionData }) {
  const [actualCash, setActualCash] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!sessionData) return null;

  const expectedCash = sessionData.openingBalance + sessionData.cashSales;
  const difference = parseFloat(actualCash || 0) - expectedCash;
  const isMatch = Math.abs(difference) < 0.01;
  const isOver = difference > 0;
  const isUnder = difference < 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actualCash === '') return;
    onCloseSession({ actualCash: parseFloat(actualCash), difference });
  };

  // Animated number component for counting effect
  const AnimatedNumber = ({ value, prefix = '₹' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      let start = 0;
      const end = value;
      const duration = 800;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [value]);

    return (
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12 }}
      >
        {prefix}{displayValue.toFixed(2)}
      </motion.span>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 via-black/50 to-black/70 backdrop-blur-md p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-xl relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-3xl blur-xl"
              animate={{ opacity: isHovered ? 0.6 : 0, scale: isHovered ? 1.02 : 1 }}
              transition={{ duration: 0.3 }}
            />

            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <Clock className="w-6 h-6 text-gray-700" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Close Session
                        </h2>
                        <p className="text-sm text-gray-600">Verify and reconcile your shift</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      className="p-2 -mr-2 rounded-full hover:bg-white/50 text-gray-500 hover:text-gray-700 transition-all duration-200"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats Grid with animations */}
                <motion.div
                  className="grid grid-cols-2 gap-4"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    variants={itemVariants}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Banknote className="w-3 h-3" />
                      Opening Cash
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      <AnimatedNumber value={sessionData.openingBalance} />
                    </p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Cash Sales
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      + <AnimatedNumber value={sessionData.cashSales} />
                    </p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="col-span-2 p-5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg"
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-primary-100 uppercase tracking-wider mb-2">
                          Expected Cash in Drawer
                        </p>
                        <p className="text-3xl font-black">
                          ₹{expectedCash.toFixed(2)}
                        </p>
                      </div>
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <Banknote className="w-12 h-12 text-primary-200" />
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Input form */}
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Actual Cash Counted
                    </label>
                    <motion.div
                      className="relative"
                      animate={isFocused ? "focus" : "blur"}
                      variants={inputVariants}
                    >
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <span className="text-3xl font-bold text-gray-400">₹</span>
                      </div>
                      <input
                        type="number"
                        autoFocus
                        placeholder="Count physical cash"
                        value={actualCash}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChange={(e) => setActualCash(e.target.value)}
                        className="w-full pl-16 pr-4 py-5 bg-gray-50 border-2 border-gray-200 focus:border-primary-500 rounded-2xl text-3xl font-bold text-gray-900 focus:ring-0 transition-all outline-none"
                      />
                    </motion.div>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {actualCash !== '' && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                      >
                        <motion.div
                          className={`p-5 rounded-2xl flex items-start gap-4 shadow-lg ${isMatch ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300' :
                              isOver ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300' :
                                'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300'
                            }`}
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: isMatch ? [0, 360] : 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            {isMatch ? (
                              <Check className="w-8 h-8 text-green-600" />
                            ) : isOver ? (
                              <TrendingUp className="w-8 h-8 text-yellow-600" />
                            ) : (
                              <TrendingDown className="w-8 h-8 text-red-600" />
                            )}
                          </motion.div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">
                              {isMatch ? "Perfect Match! 🎯" : `Variance: ₹${Math.abs(difference).toFixed(2)}`}
                            </p>
                            <p className="text-sm mt-1">
                              {isMatch ? "Drawer is exactly as expected. Perfect reconciliation!" :
                                isOver ? "You have more cash than expected. Check for unrecorded transactions." :
                                  "You are short on cash. Verify all transactions."}
                            </p>
                            {!isMatch && (
                              <motion.div
                                className="mt-3 pt-3 border-t border-current border-opacity-20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                <p className="text-xs font-mono">
                                  Expected: ₹{expectedCash.toFixed(2)} | Actual: ₹{parseFloat(actualCash || 0).toFixed(2)}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants} className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-4 px-4 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back to POS
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={actualCash === ''}
                      className="flex-1 py-4 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900 disabled:opacity-50 transition-all duration-200 shadow-xl"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: actualCash === '' ? 0 : [0, 5, -5, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        Confirm & Close Session
                      </motion.span>
                    </motion.button>
                  </motion.div>
                </motion.form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}