import React, { useEffect, useState } from 'react';
import BottomNavigation from '../components/BottomNavigation';
import OwlAssistant from '../components/OwlAssistant';
import profileService from '../services/profileService';

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    setProfile(profileService.load());
    const handleUpdate = () => setProfile(profileService.load());
    window.addEventListener('nutriowl-profile-updated', handleUpdate);
    return () => window.removeEventListener('nutriowl-profile-updated', handleUpdate);
  }, []);

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

      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
        {profile ? (
          <div className="space-y-3">
            <div><div className="text-xs text-gray-500">Name</div><div className="font-semibold">{profile.name}</div></div>
            <div><div className="text-xs text-gray-500">Email</div><div className="font-semibold">{profile.email}</div></div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="text-xs text-gray-500">Age</div><div className="font-semibold">{profile.age}</div></div>
              <div><div className="text-xs text-gray-500">Height</div><div className="font-semibold">{profile.height} cm</div></div>
              <div><div className="text-xs text-gray-500">Weight</div><div className="font-semibold">{profile.weight} kg</div></div>
            </div>
            <div><div className="text-xs text-gray-500">Activity</div><div className="font-semibold capitalize">{profile.activityLevel}</div></div>
            <div><div className="text-xs text-gray-500">Goals</div><div className="font-semibold">{(profile.goals || []).join(', ')}</div></div>
          </div>
        ) : (
          <p className="text-gray-600">Complete onboarding to add your profile details.</p>
        )}
      </div>

      <BottomNavigation active="profile" />
    </div>
  );
}
