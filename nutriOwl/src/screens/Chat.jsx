import React, { useState } from 'react'
import './screens.css'

export default function Chat({ onNavigate }) {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, from: 'owl', text: 'Hi! Ask me anything about food.' },
  ])

  function send() {
    if (!text.trim()) return
    setMessages((m) => [...m, { id: Date.now(), from: 'user', text }])
    setText('')
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, from: 'owl', text: 'Great question — balance is key!' }])
    }, 700)
  }

  return (
    <div className="screen chat-screen">
      <header className="screen-header">
        <button onClick={() => onNavigate('dashboard')}>←</button>
        <h2>Ask Owl</h2>
      </header>
      <main className="screen-body chat-body">
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.from}`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything..." />
          <button className="btn primary" onClick={send}>Send</button>
        </div>
      </main>
    </div>
  )
}
