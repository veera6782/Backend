import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FoodScanner from './pages/FoodScanner';

export default function App() {
  return (
    <Routes>
      <Route path="/scan" element={<FoodScanner />} />
      <Route path="/" element={<Navigate to="/scan" replace />} />
    </Routes>
  );
}
