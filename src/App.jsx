import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FoodScanner from './pages/FoodScanner';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import History from './pages/History';
import Onboarding from './pages/Onboarding';

function StartupGate() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('nutriowl_profile') : null;

  try {
    const profile = raw ? JSON.parse(raw) : null;
    if (profile && profile.onboardingCompleted) {
      return <Home />;
    }
  } catch (e) {
    // ignore malformed profile and send user through onboarding
  }

  return <Onboarding />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartupGate />} />
      <Route path="/home" element={<Home />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/scan" element={<FoodScanner />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
