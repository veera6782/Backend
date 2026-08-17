import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraPreview from '../components/CameraPreview';
import UploadButton from '../components/UploadButton';
import ScanButton from '../components/ScanButton';
import TipsCard from '../components/TipsCard';
import RecentScanCard from '../components/RecentScanCard';
import OwlAssistant from '../components/OwlAssistant';
import BottomNavigation from '../components/BottomNavigation';
import { analyzeFood } from '../services/foodService';

export default function FoodScanner() {
  const [tab, setTab] = useState('camera');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [scans, setScans] = useState([]);

  // subscribe to real scan history
  React.useEffect(() => {
    let mounted = true;
    async function loadScans() {
      try {
        const ss = await import('../services/scanService');
        const s = ss.default.load();
        if (!mounted) return;
        setScans(s);
        const unsub = ss.default.subscribe(list => setScans(list || []));
        return unsub;
      } catch (e) {
        console.warn('No scan service available', e);
      }
    }
    const maybeUnsub = loadScans();
    return () => {
      mounted = false;
      if (maybeUnsub && typeof maybeUnsub.then === 'function') {
        maybeUnsub.then(u => u && u());
      }
    };
  }, []);

  async function handleCapture(imageBlob) {
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeFood(imageBlob);
      setResult(res);

      // save scan to storage
      try {
        const scanService = await import('../services/scanService');
        const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const scanObj = {
          id,
          name: res.food || 'Unknown',
          calories: res.calories || 0,
          protein: res.protein || 0,
          carbs: res.carbs || res.carbohydrates || 0,
          fats: res.fat || res.fats || 0,
          image: uploadedImage || '/placeholder1.jpg',
          timestamp: new Date().toISOString(),
        };
        scanService.default.addScan(scanObj);
      } catch (e) {
        console.warn('Could not persist scan result', e);
      }

      // notify goals service that a scan occurred (increment scan goal)
      try {
        const goalsService = await import('../services/goalsService');
        if (goalsService && goalsService.default) goalsService.default.incrementProgress('scan', 1);
      } catch (e) {
        console.warn('Could not notify goals service', e);
      }
    } catch (e) {
      console.error(e);
    } finally {
      // keep loading a little to show animation
      setTimeout(() => setLoading(false), 800);
    }
  }

  return (
    <div className="min-h-screen bg-cream font-poppins text-darkgreen p-4 pb-32">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-start justify-between">
          <button aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">{
            '<'
          }</button>
          <div className="flex-1 mx-4">
            <h1 className="text-3xl font-bold">Scan Food</h1>
            <p className="text-sm text-gray-600 mt-1">Scan your meal and discover its nutrition!</p>
          </div>
          <div className="w-24 h-24">
            <OwlAssistant />
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-sm p-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setTab('camera')} className={`flex-1 py-3 rounded-lg ${tab === 'camera' ? 'bg-green-100 text-darkgreen' : 'text-gray-600'}`}>
              <span className="inline-flex items-center gap-2 justify-center"><span className="bg-green-500 text-white p-1 rounded-full">📷</span> Camera</span>
            </button>
            <button onClick={() => setTab('upload')} className={`flex-1 py-3 rounded-lg ${tab === 'upload' ? 'bg-green-100 text-darkgreen' : 'text-gray-600'}`}>
              <span className="inline-flex items-center gap-2 justify-center"><span className="bg-transparent text-darkgreen p-1 rounded-full">🖼️</span> Upload Photo</span>
            </button>
          </div>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              {tab === 'camera' ? (
                <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CameraPreview onCapture={handleCapture} uploadedImage={uploadedImage} setUploadedImage={setUploadedImage} />
                </motion.div>
              ) : (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <UploadButton onCapture={handleCapture} uploadedImage={uploadedImage} setUploadedImage={setUploadedImage} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6">
          <TipsCard />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-lg">Recent Scans</h3>
            <button className="text-green-600 font-medium">View All ›</button>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto py-2">
            {scans && scans.length ? (
              scans.slice(0,5).map(item => (
                <RecentScanCard key={item.id} item={{ id: item.id, food: item.name || item.food || 'Unknown', calories: item.calories || 0, time: new Date(item.timestamp).toLocaleString(), image: item.image || '/placeholder1.jpg' }} />
              ))
            ) : (
              <div className="bg-white rounded-2xl p-4 shadow-sm text-gray-600">No recent scans yet. Try scanning your first meal!</div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>{loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl p-6 w-80 flex flex-col items-center gap-4">
            <div className="w-32 h-32">
              <OwlAssistant flying />
            </div>
            <div className="text-center">
              <p className="font-semibold">Analyzing your meal...</p>
              <p className="text-sm text-gray-600 mt-1">This may take a moment</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <motion.div className="h-3 bg-green-400" initial={{ width: '0%' }} animate={{ width: '80%' }} transition={{ repeat: Infinity, duration: 1.6 }} />
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      <BottomNavigation active="scan" />
    </div>
  );
}
