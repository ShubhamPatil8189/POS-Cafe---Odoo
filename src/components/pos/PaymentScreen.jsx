import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, AlertCircle, QrCode,
  CreditCard, Smartphone, Banknote,
  ChevronLeft, Loader2, Sparkles,
  ArrowRight, Gift
} from 'lucide-react';
import confetti from 'canvas-confetti';
import RewardModal from './RewardModal';

export default function PaymentScreen({ isOpen, onClose, total, onPaymentSuccess }) {
  // states: 'select' | 'upi_qr' | 'processing' | 'success' | 'error'
  const [paymentState, setPaymentState] = useState('select');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [hasShownReward, setHasShownReward] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setPaymentState('select');
      setSelectedMethod('');
      setHasShownReward(false);
    }
  }, [isOpen]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3D1D6B', '#F59E0B', '#10B981']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3D1D6B', '#F59E0B', '#10B981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    const numericTotal = Number(total);
    if (method === 'upi') {
      setPaymentState('upi_qr');
    } else {
      setTimeout(() => {
        setPaymentState('success');
        triggerConfetti();
      }, 1500);
    }
  };

  const simulateUPIPayment = (success = true) => {
    const numericTotal = Number(total);
    setPaymentState('processing');
    setTimeout(() => {
      setPaymentState('success');
      triggerConfetti();
    }, 2000);
  };

  const handlePaymentSuccess = () => {
    const numericTotal = Number(total);
    // Show reward modal if total >= 500 and not shown yet
    if (numericTotal >= 500 && !hasShownReward) {
      setHasShownReward(true);
      setIsRewardModalOpen(true);
    } else {
      // No reward or already shown, complete payment
      onPaymentSuccess(selectedMethod || 'upi');
      onClose();
    }
  };

  const handleRewardFinish = () => {
    setIsRewardModalOpen(false);
    onPaymentSuccess(selectedMethod || 'upi');
    onClose();
  };

  const handleSkipReward = () => {
    setIsRewardModalOpen(false);
    onPaymentSuccess(selectedMethod || 'upi');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 sm:bg-black/40 sm:backdrop-blur-sm"
        >
          {/* Main Container */}
          <motion.div
            className={`w-full sm:max-w-md h-[90vh] sm:h-auto sm:min-h-[600px] bg-background sm:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden`}
            animate={{
              backgroundColor: paymentState === 'success' ? '#10B981' : paymentState === 'error' ? '#EF4444' : '#F9FAFB'
            }}
            transition={{ duration: 0.4 }}
          >

            {/* Header */}
            {['select', 'upi_qr'].includes(paymentState) && (
              <div className="flex items-center justify-between p-6 pb-2 relative z-10">
                {paymentState === 'upi_qr' ? (
                  <button
                    onClick={() => setPaymentState('select')}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-text-primary" />
                  </button>
                ) : (
                  <div className="w-10"></div>
                )}

                <h2 className="text-lg font-bold text-text-primary">Payment</h2>

                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full bg-surface-hover hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
              <AnimatePresence mode="wait">

                {/* 1. SELECT METHOD */}
                {paymentState === 'select' && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full flex-1 flex flex-col"
                  >
                    <div className="text-center mb-10 mt-6">
                      <p className="text-text-secondary font-medium mb-2">Amount to pay</p>
                      <h1 className="text-5xl font-black text-text-primary tracking-tight">₹{total.toFixed(2)}</h1>
                    </div>

                    <div className="space-y-4 w-full">
                      <p className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-2 pl-1">Select Method</p>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.2)' }}
                        onClick={() => handleSelectMethod('upi')}
                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border border-border hover:border-accent-300 transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center group-hover:bg-accent-500 transition-colors">
                            <QrCode className="w-6 h-6 text-accent-600 group-hover:text-white" />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-text-primary text-lg">UPI / QR Scan</span>
                            <span className="text-sm text-text-secondary">Google Pay, PhonePe, Paytm</span>
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-text-tertiary rotate-180" />
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(61, 29, 107, 0.15)' }}
                        onClick={() => handleSelectMethod('card')}
                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border border-border hover:border-primary-300 transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                            <CreditCard className="w-6 h-6 text-primary-600 group-hover:text-white" />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-text-primary text-lg">Card Terminal</span>
                            <span className="text-sm text-text-secondary">Credit or Debit Card</span>
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-text-tertiary rotate-180" />
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ y: -2 }}
                        onClick={() => handleSelectMethod('cash')}
                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border border-border hover:border-success-300 transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center group-hover:bg-success-500 transition-colors">
                            <Banknote className="w-6 h-6 text-success-600 group-hover:text-white" />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-text-primary text-lg">Cash</span>
                            <span className="text-sm text-text-secondary">Receive at counter</span>
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-text-tertiary rotate-180" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* 2. UPI QR SCREEN */}
                {paymentState === 'upi_qr' && (
                  <motion.div
                    key="upi"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full flex-1 flex flex-col items-center pt-8"
                  >
                    <div className="text-center mb-8">
                      <p className="text-text-secondary font-medium mb-1">Scan to pay</p>
                      <h2 className="text-4xl font-extrabold text-primary-900 tracking-tight">₹{total.toFixed(2)}</h2>
                    </div>

                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-primary-400 rounded-3xl blur-xl"
                      />

                      <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-border">
                        <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=pay-${total}&color=3D1D6B`}
                            alt="Payment QR"
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 text-primary-700 font-semibold">
                          <Smartphone className="w-4 h-4" /> Open any UPI app
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-10 w-full flex gap-3">
                      <button
                        onClick={() => simulateUPIPayment(false)}
                        className="flex-1 py-3.5 bg-danger-50 text-danger-600 font-bold rounded-xl hover:bg-danger-100 transition-colors"
                      >
                        Fail Test
                      </button>
                      <button
                        onClick={() => simulateUPIPayment(true)}
                        className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition-all"
                      >
                        Confirm Sync
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. PROCESSING */}
                {paymentState === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full"
                  >
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      >
                        <Loader2 className="w-16 h-16 text-primary-500" />
                      </motion.div>
                      <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-xl animate-pulse" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-text-primary">Processing Payment</h3>
                    <p className="text-text-secondary mt-2">Please wait...</p>
                  </motion.div>
                )}

                {/* 4. SUCCESS */}
                {paymentState === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full text-white text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ type: "spring", damping: 12, delay: 0.1 }}
                      className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 relative"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-white rounded-full blur-lg"
                      />
                      <Check className="w-12 h-12 text-success-500 stroke-[3]" />
                    </motion.div>

                    <motion.h2
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-black mb-1"
                    >
                      Payment Successful!
                    </motion.h2>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/80 font-medium text-lg mb-8"
                    >
                      Paid ₹{total.toFixed(2)}
                    </motion.p>

                    {/* Reward Invitation for ₹500+ orders */}
                    {total >= 500 && !hasShownReward ? (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="relative w-full max-w-sm mt-4"
                      >
                        <div className="absolute inset-0 bg-violet-600/30 blur-2xl rounded-3xl" />
                        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-8 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ repeat: Infinity, duration: 3 }}
                              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/40"
                            >
                              <Gift className="w-10 h-10 text-white" />
                            </motion.div>

                            <div>
                              <p className="text-[10px] font-black text-violet-200 uppercase tracking-[0.3em] mb-1">Elite Benefit Unlocked</p>
                              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">YOU WON A REWARD!</h3>
                            </div>

                            <p className="text-white/60 text-xs font-medium leading-relaxed px-4">
                              Step into the cinematic world of surprises. Spin the luxury wheel to claim your gift.
                            </p>

                            <button
                              onClick={handlePaymentSuccess}
                              className="group relative w-full py-4 bg-white text-orange-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/10 overflow-hidden transition-all hover:scale-105 active:scale-95"
                            >
                              <div className="absolute inset-0 bg-orange-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                Start Spin Game
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </button>

                            <button
                              onClick={handleSkipReward}
                              className="w-full py-3 text-white/50 hover:text-white font-bold uppercase text-[10px] tracking-[0.2em] transition-colors"
                            >
                              Already Spun / Skip Game
                            </button>

                            <div className="flex items-center gap-2 pt-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Experience active for 5 mins</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        onClick={handlePaymentSuccess}
                        className="mt-8 px-8 py-4 bg-white text-primary-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                      >
                        Continue
                      </button>
                    )}
                  </motion.div>
                )}

                {/* 5. ERROR */}
                {paymentState === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{
                      opacity: 1,
                      x: [-10, 10, -10, 10, 0]
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center h-full text-white"
                  >
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-3xl font-black mb-2">Payment Failed</h2>
                    <p className="text-white/80 font-medium text-center px-6">
                      There was a problem processing this transaction.
                    </p>

                    <div className="mt-12 w-full max-w-xs space-y-3">
                      <button
                        onClick={() => setPaymentState('select')}
                        className="w-full py-4 bg-white text-danger-600 font-bold rounded-xl hover:bg-slate-50 shadow-lg transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={onClose}
                        className="w-full py-4 bg-black/10 text-white font-bold rounded-xl hover:bg-black/20 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>

          {/* Reward Modal Pop-up */}
          <RewardModal
            isOpen={isRewardModalOpen}
            onClose={() => setIsRewardModalOpen(false)}
            onFinish={handleRewardFinish}
            orderId={`ORD-${Math.floor(Math.random() * 10000)}`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}