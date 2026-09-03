import goalsService from './goalsService';

const STORAGE_KEY = 'nutriowl_profile';
const SCAN_HISTORY_KEY = 'nutriowl_scan_history';

const defaultProfile = {
  name: 'Viraj Gupta',
  level: 'NutriOwl Explorer',
  streak: 12,
  points: 320,
  goalsSet: 8,
  mealsScanned: 28,
  preferences: {
    dietPreference: 'Vegetarian',
    dailyCalorieGoal: 1600,
    activityLevel: 'Moderate',
    waterGoal: 8
  },
  notifications: {
    dailyNutritionReminder: true,
    goalReminders: true,
    hydrationReminders: true
  },
  weeklyActivity: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  },
  progress: {
    calories: { current: 1200, target: 1600 },
    protein: { current: 66, target: 80 },
    carbs: { current: 195, target: 300 },
    water: { current: 5.6, target: 8 }
  }
};

let listeners = [];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readStorage(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch (error) {
    console.warn(`Unable to read storage key ${key}`, error);
    return fallbackValue;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to write storage key ${key}`, error);
  }
}

function normalizeNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function buildWeeklyActivity(input) {
  const next = { ...defaultProfile.weeklyActivity };
  if (!isObject(input)) return next;
  Object.keys(next).forEach(day => {
    const raw = input[day];
    next[day] = Boolean(raw);
  });
  return next;
}

function buildProgress(input) {
  const next = {
    calories: { ...defaultProfile.progress.calories },
    protein: { ...defaultProfile.progress.protein },
    carbs: { ...defaultProfile.progress.carbs },
    water: { ...defaultProfile.progress.water }
  };

  if (!isObject(input)) return next;

  ['calories', 'protein', 'carbs', 'water'].forEach(key => {
    const source = isObject(input[key]) ? input[key] : {};
    next[key] = {
      current: normalizeNumber(source.current, next[key].current),
      target: normalizeNumber(source.target, next[key].target)
    };
  });

  return next;
}

function buildPreferences(input) {
  const next = { ...defaultProfile.preferences };
  if (!isObject(input)) return next;

  next.dietPreference = safeText(input.dietPreference, next.dietPreference);
  next.dailyCalorieGoal = Math.max(0, normalizeNumber(input.dailyCalorieGoal, next.dailyCalorieGoal));
  next.activityLevel = safeText(input.activityLevel, next.activityLevel);
  next.waterGoal = Math.max(0, normalizeNumber(input.waterGoal, next.waterGoal));
  return next;
}

function buildNotifications(input) {
  const next = { ...defaultProfile.notifications };
  if (!isObject(input)) return next;
  next.dailyNutritionReminder = input.dailyNutritionReminder !== false;
  next.goalReminders = input.goalReminders !== false;
  next.hydrationReminders = input.hydrationReminders !== false;
  return next;
}

function deriveFromGoalsAndScans() {
  const goalsState = goalsService.getState();
  const goals = Array.isArray(goalsState?.goals) ? goalsState.goals : [];
  const scanHistory = readStorage(SCAN_HISTORY_KEY, []);
  const goalsSet = Math.max(0, goals.length);
  const mealsScanned = Array.isArray(scanHistory) ? scanHistory.length : 0;

  return {
    goalsSet,
    mealsScanned,
    streak: Math.max(1, Object.values(defaultProfile.weeklyActivity).filter(Boolean).length),
    points: Math.max(0, goalsSet * 35 + mealsScanned * 8)
  };
}

function ensureProfileShape(rawProfile) {
  const state = {
    ...defaultProfile,
    ...(isObject(rawProfile) ? rawProfile : {}),
    preferences: buildPreferences(isObject(rawProfile) ? rawProfile.preferences : null),
    notifications: buildNotifications(isObject(rawProfile) ? rawProfile.notifications : null),
    weeklyActivity: buildWeeklyActivity(isObject(rawProfile) ? rawProfile.weeklyActivity : null),
    progress: buildProgress(isObject(rawProfile) ? rawProfile.progress : null)
  };

  state.name = safeText(state.name, defaultProfile.name);
  state.level = safeText(state.level, defaultProfile.level);
  state.streak = Math.max(0, normalizeNumber(state.streak, defaultProfile.streak));
  state.points = Math.max(0, normalizeNumber(state.points, defaultProfile.points));
  state.goalsSet = Math.max(0, normalizeNumber(state.goalsSet, defaultProfile.goalsSet));
  state.mealsScanned = Math.max(0, normalizeNumber(state.mealsScanned, defaultProfile.mealsScanned));

  return state;
}

function notifyListeners(nextProfile) {
  listeners.forEach(listener => {
    try {
      listener(nextProfile);
    } catch (error) {
      console.warn('Profile listener failed', error);
    }
  });
}

export function loadProfile() {
  const saved = readStorage(STORAGE_KEY, defaultProfile);
  const normalized = ensureProfileShape(saved);
  const derived = deriveFromGoalsAndScans();

  const activeDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  normalized.weeklyActivity = { ...normalized.weeklyActivity, [activeDay]: true };
  normalized.goalsSet = derived.goalsSet;
  normalized.mealsScanned = derived.mealsScanned;
  normalized.points = Math.max(derived.points, normalized.points);
  normalized.streak = Math.max(normalized.streak, Object.values(normalized.weeklyActivity).filter(Boolean).length);

  return normalized;
}

export function saveProfile(profileInput) {
  const currentProfile = ensureProfileShape(profileInput);
  const derived = deriveFromGoalsAndScans();
  const activeDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  currentProfile.weeklyActivity = { ...currentProfile.weeklyActivity, [activeDay]: true };
  currentProfile.goalsSet = derived.goalsSet;
  currentProfile.mealsScanned = derived.mealsScanned;
  currentProfile.streak = Math.max(currentProfile.streak, Object.values(currentProfile.weeklyActivity).filter(Boolean).length);
  currentProfile.points = Math.max(derived.points, currentProfile.points);

  writeStorage(STORAGE_KEY, currentProfile);
  notifyListeners(currentProfile);
  return currentProfile;
}

export function refreshDerivedProfile() {
  const current = loadProfile();
  return saveProfile(current);
}

export function updateProfile(partialProfile) {
  const current = loadProfile();
  const nextProfile = ensureProfileShape({
    ...current,
    ...partialProfile,
    preferences: { ...current.preferences, ...(partialProfile?.preferences || {}) },
    notifications: { ...current.notifications, ...(partialProfile?.notifications || {}) },
    weeklyActivity: { ...current.weeklyActivity, ...(partialProfile?.weeklyActivity || {}) },
    progress: { ...current.progress, ...(partialProfile?.progress || {}) }
  });

  return saveProfile(nextProfile);
}

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(value => value !== listener);
  };
}

export function getScanHistory() {
  return readStorage(SCAN_HISTORY_KEY, []);
}

export function recordMealScan(scanData = {}) {
  const history = Array.isArray(getScanHistory()) ? getScanHistory() : [];
  const updated = [
    ...history,
    {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      food: safeText(scanData.food, 'Meal'),
      calories: normalizeNumber(scanData.calories, 0),
      protein: normalizeNumber(scanData.protein, 0),
      carbs: normalizeNumber(scanData.carbs, 0),
      water: normalizeNumber(scanData.water, 0)
    }
  ];

  writeStorage(SCAN_HISTORY_KEY, updated);
  const current = loadProfile();
  const activeDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  current.weeklyActivity = { ...current.weeklyActivity, [activeDay]: true };
  return saveProfile(current);
}

export function markActivityToday() {
  const current = loadProfile();
  const activeDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  current.weeklyActivity = { ...current.weeklyActivity, [activeDay]: true };
  return saveProfile(current);
}

export function getDefaultProfile() {
  return { ...defaultProfile, preferences: { ...defaultProfile.preferences }, notifications: { ...defaultProfile.notifications }, weeklyActivity: { ...defaultProfile.weeklyActivity }, progress: { ...defaultProfile.progress, calories: { ...defaultProfile.progress.calories }, protein: { ...defaultProfile.progress.protein }, carbs: { ...defaultProfile.progress.carbs }, water: { ...defaultProfile.progress.water } } };
}

export function load() {
  return loadProfile();
}

export function save(profile) {
  return saveProfile(profile);
}

export function clear() {
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners(defaultProfile);
  return defaultProfile;
}


export async function saveOnboardingProfile(profile) {
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')
  try {
    const response = await fetch(`${apiUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.message || `Profile request failed (${response.status})`)
    }
    const data = await response.json()
    return saveProfile({ ...profile, id: data.user.id })
  } catch (error) {
    console.warn('Profile API unavailable; saving locally instead.', error)
    return saveProfile(profile)
  }
}
export default {
  load,
  save,
  saveOnboardingProfile,
  clear,
  loadProfile,
  saveProfile,
  updateProfile,
  refreshDerivedProfile,
  subscribe,
  recordMealScan,
  markActivityToday,
  getScanHistory,
  getDefaultProfile
};

