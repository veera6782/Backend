import React from 'react';
import { motion } from 'framer-motion';

export default function GoalCard({ goal, onIncrement, onEdit }) {
  const completed = typeof goal.target === 'number' && goal.progress >= goal.target;
  const progressPct = goal.target ? Math.round((goal.progress / goal.target) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">{ /* placeholder icon area */ }
            <div className="text-2xl">{goal.icon || '🍎'}</div>
          </div>
          <div>
            <div className="font-semibold text-lg text-darkgreen">{goal.title}</div>
            <div className="text-sm text-gray-600 mt-1">{goal.progress} / {goal.target} {goal.unit}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label={`Edit ${goal.title}`} onClick={() => onEdit(goal)} className="text-sm text-green-600 px-3 py-2 rounded-lg">Edit</button>
          <button aria-label={`Add to ${goal.title}`} onClick={() => onIncrement(goal)} className={`w-10 h-10 rounded-full flex items-center justify-center ${completed ? 'bg-green-100 text-green-600' : 'bg-green-600 text-white'}`}>
            +
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <motion.div className={`h-3 bg-green-500`} initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-green-600">
        <div>{completed ? 'Completed' : `${progressPct}%`}</div>
        {completed && <div aria-hidden className="bg-green-100 text-green-700 px-3 py-1 rounded-full">✓</div>}
      </div>
    </div>
  );
}
