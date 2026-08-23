import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FoodScanner from './pages/FoodScanner';
import Goals from './pages/Goals';
import Onboarding from './pages/Onboarding';

function RootRedirect() {
  // if onboarding completed -> go to /scan, else go to /onboarding
  const raw = typeof window !== 'undefined' ? localStorage.getItem('nutriowl_profile') : null;
  try {
    const profile = raw ? JSON.parse(raw) : null;
    if (profile && profile.onboardingCompleted) return <Navigate to="/scan" replace />;
  } catch (e) {
    // ignore parse errors
  }
  return <Navigate to="/onboarding" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/scan" element={<FoodScanner />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/" element={<RootRedirect />} />
    </Routes>
  );
}
