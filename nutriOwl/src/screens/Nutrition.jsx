import React from 'react'
import './screens.css'

export default function Nutrition({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <button onClick={() => onNavigate('dashboard')}>←</button>
        <h2>Nutrition Breakdown</h2>
      </header>
      <main className="screen-body">
        <h3>Veg Pasta</h3>
        <ul className="nutrition-list">
          <li>Energy: <strong>320 kcal</strong></li>
          <li>Protein: <strong>12 g</strong></li>
          <li>Carbs: <strong>45 g</strong></li>
          <li>Fats: <strong>8 g</strong></li>
          <li>Fiber: <strong>5 g</strong></li>
          <li>Sugar: <strong>6 g</strong></li>
        </ul>
      </main>
    </div>
  )
}
