import React from 'react'
import '../components/Login.css'

export default function Welcome({ onNavigate }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="owl-wrap" aria-hidden>
          <svg viewBox="0 0 120 120" className="owl" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="70" rx="40" ry="30" fill="#a7c957" />
            <circle cx="42" cy="52" r="10" fill="#fff" />
            <circle cx="78" cy="52" r="10" fill="#fff" />
            <circle cx="42" cy="54" r="4" fill="#333" />
            <circle cx="78" cy="54" r="4" fill="#333" />
            <polygon points="52,88 60,80 68,88" fill="#f2cc8f" />
          </svg>
        </div>

        <h1 className="login-title">NutriOwl</h1>
        <p className="login-sub">Let's grow healthier together!</p>

        <div className="login-actions">
          <button className="btn primary" onClick={() => onNavigate('login')}>Login</button>
          <button className="btn outline" onClick={() => onNavigate('onboarding')}>Sign Up</button>
        </div>
      </div>
    </div>
  )
}
