import React from 'react';
import { motion } from 'framer-motion';

export default function RecentScanCard({ item }) {
  return (
    <motion.div whileHover={{ y: -6 }} className="min-w-[220px] bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm cursor-pointer">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img src={item.image} alt={`${item.food}`} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">{item.food}</h4>
        </div>
        <p className="text-xs text-gray-600 mt-1">{item.calories} kcal · {item.time}</p>
      </div>
      <div className="text-gray-400">›</div>
    </motion.div>
  );
}
