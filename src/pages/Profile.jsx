import React from 'react';
import BottomNavigation from '../components/BottomNavigation';

export default function Profile() {
  return (
    <div className="min-h-screen bg-cream p-6 pb-32">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-4">Profile</h1>
        <div className="bg-white p-6 rounded-2xl shadow-sm">This is a placeholder profile screen. Existing Profile navigation remains functional.</div>
        <BottomNavigation active="profile" />
      </div>
    </div>
  );
}
