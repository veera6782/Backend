import React, { useState } from 'react'
import './screens.css'

export default function Onboarding({ onNavigate }) {
  const [age, setAge] = useState(12)

  return (
    <div className="screen">
      <header className="screen-header">
        <button onClick={() => onNavigate('welcome')}>←</button>
        <h2>Onboarding Questions</h2>
      </header>

      <main className="screen-body">
        <p className="question">How old are you?</p>
        <div className="age-control">
          <button onClick={() => setAge((a) => Math.max(1, a - 1))}>-</button>
          <div className="age-value">{age}</div>
          <button onClick={() => setAge((a) => a + 1)}>+</button>
        </div>
        <button className="btn primary" onClick={() => onNavigate('dashboard')}>Next question →</button>
      </main>
    </div>
  )
}
