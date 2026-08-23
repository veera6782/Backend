import React, { useState } from 'react';

export default function QuickTopics({ onChoose }) {
  const [more, setMore] = useState(false);
  const base = [
    'Healthy snacks',
    'Calorie needs',
    'Meal ideas',
    'More'
  ];

  const moreItems = [
    'High protein foods',
    'Healthy breakfast',
    'Fruits and vegetables',
    'Hydration',
    'Fiber-rich foods'
  ];

  function handleClick(item) {
    if (item === 'More') {
      setMore(prev => !prev);
      return;
    }
    onChoose(item);
  }

  return (
    <div className="w-full">
      <div className="flex gap-3 flex-wrap">
        {base.map(i => (
          <button key={i} onClick={() => handleClick(i)} className="px-4 py-2 rounded-full bg-green-50 text-gray-800 text-sm shadow-sm">
            {i}
          </button>
        ))}
      </div>

      {more && (
        <div className="mt-3 flex gap-3 flex-wrap">
          {moreItems.map(i => (
            <button key={i} onClick={() => onChoose(i)} className="px-4 py-2 rounded-full bg-green-50 text-gray-800 text-sm shadow-sm">
              {i}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
