import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, disabled = false }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    // keep placeholder accessible
    if (!textareaRef.current) return;
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <div className="w-full bg-transparent">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask NutriOwl anything..."
            aria-label="Chat input"
            className="w-full resize-none rounded-full p-3 bg-white/60 placeholder-gray-500 focus:outline-none"
          />
        </div>
        <button
          onClick={send}
          disabled={!text.trim() || disabled}
          aria-label="Send message"
          className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}
