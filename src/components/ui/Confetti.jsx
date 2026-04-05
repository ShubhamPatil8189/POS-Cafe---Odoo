import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Particle = ({ color, x, y, rotation }) => {
  return (
    <motion.div
      initial={{
        opacity: 1,
        x: x,
        y: y,
        rotate: 0,
        scale: Math.random() * 0.5 + 0.5
      }}
      animate={{
        opacity: 0,
        x: x + (Math.random() - 0.5) * 400,
        y: y + 500 + Math.random() * 200,
        rotate: rotation * 10
      }}
      transition={{ duration: 2.5, ease: "easeOut" }}
      className="absolute w-3 h-3 pointer-events-none"
      style={{ backgroundColor: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
    />
  );
};

export default function Confetti({ active }) {
  const [particles, setParticles] = useState([]);
  const colors = ['#00F2FF', '#7000FF', '#FF00D6', '#FFD700', '#00FF94'];

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: (Math.random() - 0.5) * 360
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <Particle key={p.id} {...p} />
        ))}
      </AnimatePresence>
    </div>
  );
}
