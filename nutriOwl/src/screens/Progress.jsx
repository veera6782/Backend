import React from 'react'
import './screens.css'

export default function Progress({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <button onClick={() => onNavigate('dashboard')}>←</button>
        <h2>My Progress</h2>
      </header>
      <main className="screen-body">
        <div className="streak">Current Streak<br/><strong>7 days</strong></div>
        <div className="badges">
          <div className="badge">Water Master</div>
          <div className="badge">Fruit Lover</div>
          <div className="badge">Early Bird</div>
        </div>
      </main>
    </div>
  )
}
