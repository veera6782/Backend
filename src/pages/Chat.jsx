import React from 'react';
import BottomNavigation from '../components/BottomNavigation';
import OwlAssistant from '../components/OwlAssistant';

export default function Chat() {
  return (
    <div className="min-h-screen bg-cream font-poppins text-darkgreen p-4 pb-32">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat</h1>
          <p className="text-sm text-gray-600 mt-1">Ask NutriOwl for tips and guidance.</p>
        </div>
        <div className="w-24 h-24">
          <OwlAssistant />
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm text-gray-600">
        Chat feature is not connected to an AI yet. Use the Scan and Goals features for now.
      </div>

      <BottomNavigation active="chat" />
    </div>
  );
}
