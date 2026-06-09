import React, { useState } from 'react'
import './App.css'
import Login from './components/Login'
import Welcome from './screens/Welcome'
import Onboarding from './screens/Onboarding'
import Dashboard from './screens/Dashboard'
import Scan from './screens/Scan'
import Nutrition from './screens/Nutrition'
import Chat from './screens/Chat'
import Progress from './screens/Progress'
import ParentDashboard from './screens/ParentDashboard'
import './screens/screens.css'

function App() {
  const [screen, setScreen] = useState('welcome')

  function navigate(name) {
    setScreen(name)
  }

  if (screen === 'login') return <Login />
  if (screen === 'welcome') return <Welcome onNavigate={navigate} />
  if (screen === 'onboarding') return <Onboarding onNavigate={navigate} />
  if (screen === 'dashboard') return <Dashboard onNavigate={navigate} />
  if (screen === 'scan') return <Scan onNavigate={navigate} />
  if (screen === 'nutrition') return <Nutrition onNavigate={navigate} />
  if (screen === 'chat') return <Chat onNavigate={navigate} />
  if (screen === 'progress') return <Progress onNavigate={navigate} />
  if (screen === 'parent') return <ParentDashboard onNavigate={navigate} />

  return <Welcome onNavigate={navigate} />
}

export default App
