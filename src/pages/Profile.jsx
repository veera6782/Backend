import React from 'react';
import BottomNavigation from '../components/BottomNavigation';
import OwlAssistant from '../components/OwlAssistant';

export default function Profile() {
  return (
    <div className="min-h-screen bg-cream font-poppins text-darkgreen p-4 pb-32">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account and preferences.</p>
        </div>
        <div className="w-24 h-24">
          <OwlAssistant />
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm text-gray-600">
        Profile editing is not required for the core home/scan/goals flow.
      </div>

      <BottomNavigation active="profile" />
    </div>
  );
}
