import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function OwlAssistant({ flying = false }) {
  useEffect(() => {}, []);

  return (
    <div className="relative">
      <motion.div animate={{ opacity: [0.95, 1, 0.95] }} transition={{ duration: 3, repeat: Infinity }}>
        <img src="/owl.png" alt="NutriOwl" className="w-full h-full object-contain" />
      </motion.div>
      <motion.div initial={{ scale: 0.8, y: -6 }} animate={{ scale: [0.9, 1], y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="absolute -top-2 right-0">
        <div className="bg-white p-2 rounded-full shadow text-xs">Let&apos;s see what&apos;s on your plate!</div>
      </motion.div>
    </div>
  );
}
