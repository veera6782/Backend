import React, { useEffect, useState } from 'react';
import OwlAssistant from '../components/OwlAssistant';
import BottomNavigation from '../components/BottomNavigation';
import goalsService from '../services/goalsService';
import GoalCard from '../components/GoalCard';
import GoalEditor from '../components/GoalEditor';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const g = goalsService.load();
      setGoals(g);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }

    const unsub = goalsService.subscribe(state => {
      setGoals(state.goals);
    });
    return unsub;
  }, []);

  function handleIncrement(goal) {
    // increment by 1 (or a sensible amount for numeric goals)
    const amount = goal.type === 'number' ? 10 : 1; // for protein add 10g per tap as a friendly increment
    goalsService.incrementProgress(goal.id, amount);
    setMessage("Nice progress!");
    clearMessageLater();
  }

  function clearMessageLater() {
    setTimeout(() => setMessage(''), 1600);
  }

  function handleEdit(goal) {
    setEditing(goal);
  }

  function handleSave(edited) {
    goalsService.updateGoal(edited.id, { target: edited.target });
    setEditing(null);
  }

  function dayStreakCount() {
    // count completed daily goals
    return goals.filter(g => g.daily && g.progress >= g.target).length;
  }

  if (loading) return <div className="min-h-screen bg-cream p-4">Loading goals...</div>;

  return (
    <div className="min-h-screen bg-cream font-poppins text-darkgreen p-4 pb-32">
      <div className="flex items-start justify-between">
        <button aria-label="Back" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">{'<'}</button>
        <div className="flex-1 mx-4">
          <h1 className="text-3xl font-bold">Your Goals</h1>
          <p className="text-sm text-gray-600 mt-1">Set your goals, stay consistent and become your healthiest self!</p>
        </div>
        <div className="w-24 h-24">
          <OwlAssistant />
        </div>
      </div>

      <div className="mt-6 bg-green-50 rounded-2xl p-4 flex items-center gap-4">
        <div className="bg-white rounded-xl p-3 w-20 h-20 flex flex-col items-center justify-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{dayStreakCount()}</div>
          <div className="text-xs text-gray-600">Day Streak</div>
        </div>
        <div className="flex-1">
          <div className="font-semibold">You&apos;re doing awesome! 🔥</div>
          <div className="text-sm text-gray-600 mt-2">Keep going to reach your next milestone.</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-lg">Daily Goals</h3>
          <div className="text-green-600 text-sm">{goals.filter(g=>g.daily).filter(g=>g.progress>=g.target).length}/{goals.filter(g=>g.daily).length} completed</div>
        </div>

        <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
          {goals.filter(g=>g.daily).map(g => (
            <GoalCard key={g.id} goal={g} onIncrement={() => handleIncrement(g)} onEdit={() => handleEdit(g)} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-lg">Weekly Goals</h3>
          <div className="text-green-600 text-sm">{goals.filter(g=>!g.daily).filter(g=>g.progress>=g.target).length}/{goals.filter(g=>!g.daily).length} completed</div>
        </div>

        <div className="mt-3 bg-green-50 rounded-2xl p-4 shadow-sm">
          {goals.filter(g=>!g.daily).map(g => (
            <GoalCard key={g.id} goal={g} onIncrement={() => handleIncrement(g)} onEdit={() => handleEdit(g)} />
          ))}
        </div>
      </div>

      {message && (
        <div className="fixed right-6 bottom-36 bg-green-600 text-white px-4 py-2 rounded-lg shadow">{message}</div>
      )}

      {editing && <GoalEditor goal={editing} onSave={handleSave} onClose={() => setEditing(null)} />}

      <BottomNavigation active="goals" />
    </div>
  );
}
