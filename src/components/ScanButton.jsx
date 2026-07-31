import React from 'react';

export default function ScanButton({ onClick }) {
  return (
    <button aria-label="Scan" onClick={onClick} className="w-20 h-20 rounded-full bg-green-500 shadow-lg border-8 border-white flex items-center justify-center focus:outline-none">
      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">📷</div>
    </button>
  );
}
