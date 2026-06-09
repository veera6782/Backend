import React from 'react'
import './screens.css'

export default function Scan({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <button onClick={() => onNavigate('dashboard')}>←</button>
        <h2>Scan your food</h2>
      </header>
      <main className="screen-body">
        <div className="camera-placeholder">Point the camera at your meal</div>
        <button className="btn primary">Start Scan</button>
      </main>
    </div>
  )
}
