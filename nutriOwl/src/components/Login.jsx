import React from 'react'
import './Login.css'

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="owl-wrap" aria-hidden>
          <svg viewBox="0 0 120 120" className="owl" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0" stopColor="#6a994e" />
                <stop offset="1" stopColor="#a7c957" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="70" rx="40" ry="30" fill="url(#g)" />
            <circle cx="42" cy="52" r="10" fill="#fff" />
            <circle cx="78" cy="52" r="10" fill="#fff" />
            <circle cx="42" cy="54" r="4" fill="#333" />
            <circle cx="78" cy="54" r="4" fill="#333" />
            <path d="M45 36 Q60 20 75 36" fill="#d9ed92" stroke="#7aa05b" strokeWidth="2" />
            <path d="M60 60 L60 80" stroke="#6b8e3a" strokeWidth="3" strokeLinecap="round" />
            <polygon points="52,88 60,80 68,88" fill="#f2cc8f" />
          </svg>
        </div>

        <h1 className="login-title">Let's grow healthier together!</h1>

        <p className="login-sub">Welcome to NutriOwl — track, learn, and thrive.</p>

        <div className="login-actions">
          <button className="btn primary">Sign In</button>
          <button className="btn outline">Sign Up</button>
        </div>
      </div>
    </div>
  )
}
