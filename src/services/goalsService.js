// Simple goals service using localStorage and a basic event listener pattern
const STORAGE_KEY = 'nutri_goals_v1';

const defaultGoals = [
  {
    id: 'scan',
    title: 'Scan a meal',
    type: 'count',
    unit: 'meal scanned',
    target: 1,
    progress: 0,
    daily: true
  },
  {
    id: 'protein',
    title: 'Eat enough proteins',
    type: 'number',
    unit: 'g',
    target: 50,
    progress: 0,
    daily: true
  },
  {
    id: 'fruits',
    title: 'Eat 2 fruits',
    type: 'count',
    unit: 'servings',
    target: 2,
    progress: 0,
    daily: true
  },
  {
    id: 'water',
    title: 'Drink 6 glasses of water',
    type: 'count',
    unit: 'glasses',
    target: 6,
    progress: 0,
    daily: true
  },
  {
    id: 'active',
    title: 'Be active 5 days this week',
    type: 'count',
    unit: 'days',
    target: 5,
    progress: 0,
    daily: false
  },
  {
    id: 'healthyMeals',
    title: 'Make healthy food choices',
    type: 'count',
    unit: 'healthy meals',
    target: 20,
    progress: 0,
    daily: false
  }
];

let listeners = [];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {
      goals: defaultGoals,
      lastSaved: null
    };
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read goals from storage', e);
    return { goals: defaultGoals, lastSaved: null };
  }
}

function saveStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach(l => l(state));
  } catch (e) {
    console.error('Failed to save goals to storage', e);
  }
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function ensureDailyReset(state) {
  const now = new Date();
  if (!state.lastSaved) {
    state.lastSaved = now.toISOString();
    return state;
  }
  if (!isSameDay(state.lastSaved, now.toISOString())) {
    // reset daily goals' progress
    state.goals = state.goals.map(g => ({ ...g, progress: g.daily ? 0 : g.progress }));
    state.lastSaved = now.toISOString();
  }
  return state;
}

const goalsService = {
  load() {
    const state = readStorage();
    ensureDailyReset(state);
    saveStorage(state);
    return state.goals;
  },
  getState() {
    const state = readStorage();
    ensureDailyReset(state);
    return state;
  },
  subscribe(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },
  saveGoals(goals) {
    const state = { goals, lastSaved: new Date().toISOString() };
    saveStorage(state);
  },
  updateGoal(id, patch) {
    const state = readStorage();
    state.goals = state.goals.map(g => g.id === id ? { ...g, ...patch } : g);
    state.lastSaved = new Date().toISOString();
    saveStorage(state);
  },
  incrementProgress(id, amount = 1) {
    const state = readStorage();
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;
    goal.progress = (goal.progress || 0) + amount;
    // Cap at target
    if (typeof goal.target === 'number') goal.progress = Math.min(goal.progress, goal.target);
    state.lastSaved = new Date().toISOString();
    saveStorage(state);
  },
  setProgress(id, value) {
    const state = readStorage();
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;
    goal.progress = value;
    if (typeof goal.target === 'number') goal.progress = Math.min(goal.progress, goal.target);
    state.lastSaved = new Date().toISOString();
    saveStorage(state);
  },
  addGoal(goal) {
    const state = readStorage();
    state.goals.push(goal);
    state.lastSaved = new Date().toISOString();
    saveStorage(state);
  },
  resetDaily() {
    const state = readStorage();
    state.goals = state.goals.map(g => ({ ...g, progress: g.daily ? 0 : g.progress }));
    state.lastSaved = new Date().toISOString();
    saveStorage(state);
  }
};

export default goalsService;
