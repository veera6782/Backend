import React from 'react';
import OwlAssistant from './OwlAssistant';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`w-full flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 mr-3">
          <img src="/owl-smile.png" alt="NutriOwl" className="w-10 h-10 rounded-full object-cover" />
        </div>
      )}

      <div className={`max-w-[78%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block p-4 rounded-2xl shadow-sm ${isUser ? 'bg-green-50 text-gray-900 rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>{time}</div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 ml-3" aria-hidden>
          {/* keep space for alignment */}
        </div>
      )}
    </div>
  );
}
