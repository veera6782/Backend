import React from 'react'
import './screens.css'

export default function Dashboard({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <h2>Hi, Anaya! 👋</h2>
        <button onClick={() => onNavigate('parent')}>👤</button>
      </header>

      <main className="screen-body">
        <div className="owl-card">
          <div className="owl-small" />
          <p>Great job today!</p>
        </div>

        <section className="goals">
          <div className="goal">Water<br/><strong>6/8</strong></div>
          <div className="goal">Fruits<br/><strong>1/3</strong></div>
          <div className="goal">Exercise<br/><strong>20/30 min</strong></div>
          <div className="goal">Sleep<br/><strong>7/8 hr</strong></div>
        </section>

        <div className="quick-actions">
          <button onClick={() => onNavigate('scan')}>Scan Food</button>
          <button onClick={() => onNavigate('chat')}>Ask Owl</button>
          <button onClick={() => onNavigate('progress')}>My Progress</button>
        </div>
      </main>
    </div>
  )
}
