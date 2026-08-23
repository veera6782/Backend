import React, { useEffect, useState } from 'react';
import BottomNavigation from '../components/BottomNavigation';
import RecentScanCard from '../components/RecentScanCard';
import scanService from '../services/scanService';
import OwlAssistant from '../components/OwlAssistant';

export default function History() {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    try {
      const s = scanService.load();
      setScans(s);
    } catch (e) {
      console.error('Failed to load scan history', e);
      setScans([]);
    }
    const unsub = scanService.subscribe(s => setScans(s || []));
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-cream font-poppins text-darkgreen p-4 pb-32">
      <div className="flex items-start justify-between">
        <button aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">{'<'}</button>
        <div className="flex-1 mx-4">
          <h1 className="text-3xl font-bold">Scan History</h1>
          <p className="text-sm text-gray-600 mt-1">Your saved scans are shown below.</p>
        </div>
        <div className="w-24 h-24">
          <OwlAssistant />
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
        {scans.length ? (
          <div className="flex flex-col gap-3">
            {scans.map(item => (
              <div key={item.id} className="p-2">
                <RecentScanCard item={{ id: item.id, food: item.name || item.food || 'Unknown', calories: item.calories || 0, time: new Date(item.timestamp).toLocaleString(), image: item.image || '/placeholder1.jpg' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600 p-6 text-center">No scans yet. Try scanning your first meal!</div>
        )}
      </div>

      <BottomNavigation active="home" />
    </div>
  );
}
