import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FoodScanner from './pages/FoodScanner';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import History from './pages/History';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scan" element={<FoodScanner />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/history" element={<History />} />
      {/* fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
