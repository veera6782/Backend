import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import QuickTopics from '../components/QuickTopics';
import nutriService from '../services/nutriOwlChat';
import BottomNavigation from '../components/BottomNavigation';

const STORAGE_KEY = 'nutriowl_chat_messages';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const defaultConversation = [
  {
    id: makeId(),
    sender: 'user',
    text: 'What are some high protein foods?',
    timestamp: new Date().toISOString()
  },
  {
    id: makeId(),
    sender: 'owl',
    text: 'Great question! Here are some high-protein foods you can include in your meals: eggs, chicken or fish (if you eat animal products), paneer or tofu, lentils and beans, Greek yogurt and dairy, and nuts & seeds.',
    timestamp: new Date().toISOString()
  },
  {
    id: makeId(),
    sender: 'user',
    text: 'How much water should I drink daily?',
    timestamp: new Date().toISOString()
  },
  {
    id: makeId(),
    sender: 'owl',
    text: 'A common guideline is about 6–8 cups (1.5–2 liters) per day for many adults, but needs vary with activity, climate, and body size. Drink more when exercising or in hot weather.',
    timestamp: new Date().toISOString()
  }
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat from storage, using default conversation', e);
    }

    setMessages(defaultConversation);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat to storage', e);
    }
  }, [messages]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage(text) {
    const userMsg = { id: makeId(), sender: 'user', text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    setLoading(true);
    const placeholder = { id: 'thinking', sender: 'owl', text: 'NutriOwl is thinking...', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, placeholder]);

    try {
      const response = await nutriService.getNutriOwlResponse(text);
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));
      const owlMsg = { id: makeId(), sender: 'owl', text: response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, owlMsg]);
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));
      const errMsg = { id: makeId(), sender: 'owl', text: 'Sorry, something went wrong while preparing a response.', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleQuick(topic) {
    sendMessage(topic);
  }

  return (
    <div className="min-h-screen bg-cream p-6 pb-32">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-green-800">NutriOwl Chat</h1>
            <p className="text-gray-600">Your friendly nutrition buddy is here to help!</p>
          </div>
          <div className="w-28 h-28">
            <img src="/owl.png" alt="NutriOwl" className="w-full h-full object-contain" />
          </div>
        </header>

        <section className="bg-green-50 rounded-2xl p-4 shadow-inner mb-4">
          <div className="flex items-start gap-4">
            <img src="/owl-smile.png" alt="NutriOwl" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="font-semibold text-green-800">Hi there! 👋</div>
              <div className="text-gray-600">Ask me anything about nutrition, healthy eating or your diet!</div>
            </div>
            <div className="ml-auto">
              <button className="px-3 py-2 bg-white rounded-full shadow-sm">Topics</button>
            </div>
          </div>
        </section>

        <div ref={listRef} className="bg-white rounded-2xl p-6 shadow-sm h-[60vh] overflow-auto mb-4">
          {messages.map(m => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </div>

        <div className="mb-4">
          <QuickTopics onChoose={handleQuick} />
        </div>

        <div className="fixed left-6 right-6 bottom-24 bg-transparent p-4">
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>

        <BottomNavigation active="chat" />
      </div>
    </div>
  );
}
