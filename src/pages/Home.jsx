import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OwlAssistant from '../components/OwlAssistant';
import BottomNavigation from '../components/BottomNavigation';
import GoalCard from '../components/GoalCard';
import RecentScanCard from '../components/RecentScanCard';
import TipsCard from '../components/TipsCard';
import goalsService from '../services/goalsService';
import scanService from '../services/scanService';

export default function Home() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [scans, setScans] = useState([]);

  useEffect(() => {
    try {
      const g = goalsService.load();
      setGoals(g);
    } catch (e) {
      console.error('Failed to load goals for Home', e);
      setGoals([]);
    }

    const unsubG = goalsService.subscribe(state => setGoals(state.goals || []));

    // subscribe scans
    const unsubS = scanService.subscribe(s => setScans(s || []));

    return () => {
      if (unsubG) unsubG();
      if (unsubS) unsubS();
    };
  }, []);

  function handleScanClick() {
    navigate('/scan');
  }

  function handleViewAllScans() {
    navigate('/history');
  }

  const dailyGoals = goals.filter(g => g.daily);

  return (
    <div className="min-h-screen bg-cream font-poppins text-darkgreen p-4 pb-32">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hello, Friend! 👋</h1>
          <p className="text-sm text-gray-600 mt-1">Let’s make today a <span className="text-green-600">healthy</span> day!</p>
        </div>
        <div className="w-28 h-28">
          <OwlAssistant />
        </div>
      </div>

      <div className="mt-6">
        {/* Show first daily goal in prominent card (keeps original design) */}
        {dailyGoals.length ? (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">Today’s Goal</div>
                <div className="text-sm text-gray-600 mt-1">{dailyGoals[0].title}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{dailyGoals[0].progress}/{dailyGoals[0].target}</div>
                <div className="text-sm text-gray-600">{dailyGoals[0].unit}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="h-3 bg-green-500" style={{ width: `${dailyGoals[0].target ? Math.round((dailyGoals[0].progress / dailyGoals[0].target) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-gray-600">No goals yet. Tap Goals to set your first one!</div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        <button onClick={handleScanClick} className="bg-white rounded-xl p-3 flex flex-col items-center text-sm shadow-sm">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">🍏</div>
          <div className="mt-2">Scan Food</div>
          <div className="text-xs text-gray-500">Check nutrition</div>
        </button>
        <button onClick={() => navigate('/goals')} className="bg-white rounded-xl p-3 flex flex-col items-center text-sm shadow-sm">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">🎯</div>
          <div className="mt-2">Goals</div>
          <div className="text-xs text-gray-500">Track progress</div>
        </button>
        <button onClick={() => navigate('/chat')} className="bg-white rounded-xl p-3 flex flex-col items-center text-sm shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">💬</div>
          <div className="mt-2">Chat</div>
          <div className="text-xs text-gray-500">Ask NutriOwl</div>
        </button>
        <button onClick={() => navigate('/profile')} className="bg-white rounded-xl p-3 flex flex-col items-center text-sm shadow-sm">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">👤</div>
          <div className="mt-2">Profile</div>
          <div className="text-xs text-gray-500">View & edit</div>
        </button>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Today’s Summary</h3>
          <button onClick={() => navigate('/goals')} className="text-green-600 text-sm">View All</button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {/* Reuse GoalCard for summary small cards (non-interactive) */}
          {dailyGoals.slice(0,3).map(g => (
            <div key={g.id} className="bg-green-50 rounded-xl p-3 text-center">
              <div className="font-semibold">{g.title}</div>
              <div className="text-2xl font-bold text-green-600 mt-2">{g.target ? Math.round((g.progress / g.target) * 100) : 0}%</div>
              <div className="text-xs text-gray-600 mt-1">{g.progress}/{g.target}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-lg">Recent Scans</h3>
          <button onClick={handleViewAllScans} className="text-green-600 font-medium">View All ›</button>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto py-2">
          {scans.length ? scans.slice(0,5).map(item => (
            <RecentScanCard key={item.id} item={{ id: item.id, food: item.name || item.food || 'Unknown', calories: item.calories || 0, time: item.time || new Date(item.timestamp).toLocaleString(), image: item.image || '/placeholder1.jpg' }} />
          )) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm w-full text-center text-gray-600">Your food journey starts here! 🌱<div className="mt-3"><button onClick={handleScanClick} className="px-4 py-2 bg-green-600 text-white rounded-lg">Scan your first meal</button></div></div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <TipsCard />
      </div>

      <BottomNavigation active="home" />
    </div>
  );
}
