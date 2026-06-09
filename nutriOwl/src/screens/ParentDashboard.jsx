import React from 'react'
import './screens.css'

export default function ParentDashboard({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <button onClick={() => onNavigate('dashboard')}>←</button>
        <h2>Parent Dashboard</h2>
      </header>
      <main className="screen-body">
        <div className="metrics">
          <div>Meals Scanned<br/><strong>14</strong></div>
          <div>Active Time<br/><strong>2h 30m</strong></div>
          <div>Water Intake<br/><strong>6/8</strong></div>
        </div>
      </main>
    </div>
  )
}
