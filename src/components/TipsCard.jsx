import React from 'react';

export default function TipsCard() {
  return (
    <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">💡</div>
      <div className="flex-1">
        <p className="font-semibold">Tips for best results</p>
        <p className="text-sm text-gray-600">Use natural light and try to avoid blurry images for accurate results.</p>
      </div>
      <div className="w-20 h-20">
        {/* small owl illustration placeholder */}
        <img src="/owl-smile.png" alt="nutriowl" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}
