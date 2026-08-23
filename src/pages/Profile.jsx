import React, { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiBell, FiCalendar, FiCheck, FiChevronRight, FiDroplet, FiHelpCircle, FiLogOut, FiSettings, FiShield, FiTarget, FiUser, FiZap } from 'react-icons/fi';
import OwlAssistant from '../components/OwlAssistant';
import BottomNavigation from '../components/BottomNavigation';
import goalsService from '../services/goalsService';
import profileService from '../services/profileService';

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const shortDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function clampPercentage(value) {
  if (!Number.isFinite(Number(value))) return 0;
  return Math.min(100, Math.max(0, Number(value)));
}

function getProgressColor(key) {
  switch (key) {
    case 'calories':
      return '#f59e0b';
    case 'protein':
      return '#4CAF50';
    case 'carbs':
      return '#f59e0b';
    case 'water':
      return '#4CAF50';
    default:
      return '#4CAF50';
  }
}

function CircularProgress({ value, target, label, color, icon, unit }) {
  const percentage = target > 0 ? (value / target) * 100 : 0;
  const displayValue = clampPercentage(percentage);
  const style = {
    background: `conic-gradient(${color} ${displayValue * 3.6}deg, #e7efe0 0deg)`
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24 rounded-full p-2" style={style}>
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#f8faf5]">
          <span className="text-xl font-bold text-darkgreen">{Math.round(displayValue)}%</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-darkgreen">
        <span className="text-lg" aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-2 text-center text-sm text-gray-600">
        <div className="font-medium text-darkgreen">{label}</div>
        <div className="text-xs text-gray-500">{Math.round(value)} / {Math.round(target)} {unit}</div>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children, actions }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d2d1f]/30 p-4">
      <div className="w-full max-w-md rounded-[28px] bg-[#f8faf5] p-5 shadow-[0_18px_50px_rgba(31,51,39,0.18)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-darkgreen">{title}</h3>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="h-9 w-9 rounded-full bg-white text-lg text-darkgreen shadow-sm">×</button>
        </div>
        {children}
        {actions && <div className="mt-5 flex justify-end gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(() => profileService.loadProfile());
  const [modalType, setModalType] = useState(null);
  const [draft, setDraft] = useState(() => profileService.loadProfile());

  useEffect(() => {
    const unsub = profileService.subscribe(nextProfile => {
      setProfile(nextProfile);
      setDraft(nextProfile);
    });

    const goalsUnsub = goalsService.subscribe(() => {
      const refreshed = profileService.refreshDerivedProfile();
      setProfile(refreshed);
      setDraft(refreshed);
    });

    return () => {
      unsub();
      goalsUnsub();
    };
  }, []);

  const progressCards = useMemo(() => [
    {
      key: 'calories',
      label: 'Calories',
      value: Number(profile.progress?.calories?.current ?? 0),
      target: Number(profile.progress?.calories?.target ?? 1600),
      icon: '🔥',
      unit: 'kcal',
      color: '#f59e0b'
    },
    {
      key: 'protein',
      label: 'Protein',
      value: Number(profile.progress?.protein?.current ?? 0),
      target: Number(profile.progress?.protein?.target ?? 80),
      icon: '🏋️',
      unit: 'g',
      color: '#4CAF50'
    },
    {
      key: 'carbs',
      label: 'Carbs',
      value: Number(profile.progress?.carbs?.current ?? 0),
      target: Number(profile.progress?.carbs?.target ?? 300),
      icon: '🌾',
      unit: 'g',
      color: '#f59e0b'
    },
    {
      key: 'water',
      label: 'Water',
      value: Number(profile.progress?.water?.current ?? 0),
      target: Number(profile.progress?.water?.target ?? 8),
      icon: '💧',
      unit: 'L',
      color: '#4CAF50'
    }
  ], [profile]);

  const preferenceCards = [
    {
      key: 'dietPreference',
      label: 'Diet Preference',
      value: profile.preferences?.dietPreference || 'Vegetarian',
      icon: <FiTarget className="text-xl text-green-700" />,
      valueClass: 'text-base font-medium'
    },
    {
      key: 'dailyCalorieGoal',
      label: 'Daily Calorie Goal',
      value: `${profile.preferences?.dailyCalorieGoal || 1600} kcal`,
      icon: <FiZap className="text-xl text-yellow-500" />,
      valueClass: 'text-base font-medium'
    },
    {
      key: 'activityLevel',
      label: 'Activity Level',
      value: profile.preferences?.activityLevel || 'Moderate',
      icon: <FiActivity className="text-xl text-green-700" />,
      valueClass: 'text-base font-medium'
    },
    {
      key: 'waterGoal',
      label: 'Water Goal',
      value: `${profile.preferences?.waterGoal || 8} glasses`,
      icon: <FiDroplet className="text-xl text-sky-500" />,
      valueClass: 'text-base font-medium'
    }
  ];

  const menuRows = [
    { key: 'personal', label: 'Personal Information', icon: <FiUser className="text-lg" />, description: 'View your profile details' },
    { key: 'notifications', label: 'Notifications', icon: <FiBell className="text-lg" />, description: 'Manage reminders' },
    { key: 'privacy', label: 'Privacy & Security', icon: <FiShield className="text-lg" />, description: 'Local data and privacy' },
    { key: 'support', label: 'Help & Support', icon: <FiHelpCircle className="text-lg" />, description: 'Learn how NutriOwl works' },
    { key: 'logout', label: 'Log Out', icon: <FiLogOut className="text-lg" />, description: 'Sign out safely' }
  ];

  const weeklyChecks = dayOrder.map((day, index) => ({
    key: day,
    label: shortDays[index],
    checked: Boolean(profile.weeklyActivity?.[day])
  }));

  const openModal = (type) => {
    setModalType(type);
    setDraft(profile);
  };

  const updateDraft = (update) => {
    setDraft(current => ({
      ...current,
      ...update,
      preferences: { ...current.preferences, ...(update.preferences || {}) },
      notifications: { ...current.notifications, ...(update.notifications || {}) }
    }));
  };

  const handleSaveProfile = () => {
    const saved = profileService.updateProfile(draft);
    setProfile(saved);
    setModalType(null);
  };

  const handleSavePreferences = () => {
    const saved = profileService.updateProfile({
      name: draft.name,
      preferences: draft.preferences,
      notifications: draft.notifications
    });
    setProfile(saved);
    setModalType(null);
  };

  const handleLogout = () => {
    setModalType(null);
    profileService.updateProfile({
      ...profile,
      notifications: profile.notifications
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f4ee] font-poppins text-darkgreen p-4 pb-32">
      <div className="mx-auto max-w-[420px]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">My Profile</h1>
            <p className="mt-2 text-lg text-gray-600">Manage your profile and<br />track your nutrition journey!</p>
          </div>
          <div className="relative ml-2 mt-2 flex h-28 w-28 items-center justify-center">
            <button aria-label="Open settings" onClick={() => openModal('settings')} className="absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f7ee] text-xl text-green-700 shadow-sm">
              <FiSettings />
            </button>
            <div className="h-24 w-24">
              <OwlAssistant />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-[#dfeccd] p-4 shadow-[0_8px_18px_rgba(86,103,76,0.08)]">
          <button onClick={() => openModal('personal')} aria-label="Edit profile" className="flex w-full items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#bde09f] text-3xl text-green-800 shadow-inner">
                <FiUser />
              </div>
              <div>
                <div className="text-2xl font-bold text-darkgreen">{profile.name}</div>
                <div className="text-base text-gray-700">{profile.level}</div>
                <div className="mt-2 inline-flex rounded-full bg-[#edf5e6] px-3 py-1 text-sm font-medium text-darkgreen">Level {profile.level.includes('Explorer') ? '4' : '1'}</div>
              </div>
            </div>
            <div className="text-3xl text-darkgreen"><FiChevronRight /></div>
          </button>
        </div>

        <div className="mt-5 rounded-[26px] bg-[#edf4e2] p-3 shadow-[0_8px_18px_rgba(86,103,76,0.08)]">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#f8faf5] p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-[#ff9c2a]">
                <span aria-hidden="true">🔥</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-darkgreen">{profile.streak}</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
            <div className="rounded-2xl bg-[#f8faf5] p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-[#f3b312]">
                <span aria-hidden="true">⭐</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-darkgreen">{profile.points}</div>
              <div className="text-xs text-gray-600">Nutri Points</div>
            </div>
            <div className="rounded-2xl bg-[#f8faf5] p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-[#4CAF50]">
                <span aria-hidden="true">🎯</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-darkgreen">{profile.goalsSet}</div>
              <div className="text-xs text-gray-600">Goals Set</div>
            </div>
            <div className="rounded-2xl bg-[#f8faf5] p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-[#4CAF50]">
                <span aria-hidden="true">📷</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-darkgreen">{profile.mealsScanned}</div>
              <div className="text-xs text-gray-600">Meals Scanned</div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-[#edf4e2] p-4 shadow-[0_8px_18px_rgba(86,103,76,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-darkgreen">My Progress</h2>
            <button aria-label="Change progress period" className="inline-flex items-center gap-2 rounded-full bg-[#f8faf5] px-3 py-2 text-sm font-medium text-darkgreen shadow-sm">
              <FiCalendar />
              This Week
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {progressCards.map(item => (
              <CircularProgress key={item.key} value={item.value} target={item.target} label={item.label} color={item.color} icon={item.icon} unit={item.unit} />
            ))}
            <div className="rounded-[24px] bg-[#f7f8f1] p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-semibold text-darkgreen">Weekly Streak</div>
                <div className="text-sm text-gray-600">{profile.streak} days</div>
              </div>
              <div className="mt-3 flex justify-between gap-1">
                {weeklyChecks.map((day) => (
                  <div key={day.key} className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{day.label}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${day.checked ? 'bg-[#cfe1b7] text-[#294b2b]' : 'bg-[#ebf0e4] text-gray-400'}`}>
                      {day.checked ? <FiCheck className="text-sm" /> : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-[#dfeccd] p-2">
                  <OwlAssistant />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-[#edf4e2] p-4 shadow-[0_8px_18px_rgba(86,103,76,0.08)]">
          <button onClick={() => openModal('preferences')} className="flex w-full items-center justify-between gap-3 text-left" aria-label="Edit preferences">
            <h2 className="text-3xl font-bold text-darkgreen">My Preferences</h2>
            <div className="text-3xl text-darkgreen"><FiChevronRight /></div>
          </button>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {preferenceCards.map((entry) => (
              <button key={entry.key} onClick={() => openModal('preferences')} className="rounded-[20px] bg-[#f9f9f2] p-3 text-left shadow-sm" aria-label={`Edit ${entry.label}`}>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ecf5e7]">{entry.icon}</div>
                <div className="text-sm text-gray-600">{entry.label}</div>
                <div className={`${entry.valueClass} mt-2 text-darkgreen`}>{entry.value}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-[#f3f7ee] p-2 shadow-[0_8px_18px_rgba(86,103,76,0.08)]">
          {menuRows.map((row) => (
            <button key={row.key} onClick={() => openModal(row.key)} aria-label={row.label} className="flex w-full items-center justify-between gap-3 rounded-[20px] px-3 py-4 text-left transition hover:bg-white/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5e6] text-darkgreen">
                  {row.icon}
                </div>
                <div className="text-xl font-medium text-darkgreen">{row.label}</div>
              </div>
              <FiChevronRight className="text-2xl text-darkgreen" />
            </button>
          ))}
        </div>

        <BottomNavigation active="profile" />
      </div>

      {modalType && (
        <ModalShell
          title={
            modalType === 'personal' ? 'Edit Profile' :
            modalType === 'preferences' ? 'Preferences' :
            modalType === 'notifications' ? 'Notifications' :
            modalType === 'privacy' ? 'Privacy & Security' :
            modalType === 'support' ? 'Help & Support' :
            modalType === 'logout' ? 'Log Out' :
            modalType === 'settings' ? 'Settings' : 'Profile'
          }
          onClose={() => setModalType(null)}
          actions={
            modalType === 'logout'
              ? [
                  <button key="cancel" type="button" onClick={() => setModalType(null)} className="rounded-full bg-[#edf5e6] px-4 py-2 font-medium text-darkgreen">Cancel</button>,
                  <button key="confirm" type="button" onClick={handleLogout} className="rounded-full bg-[#4CAF50] px-4 py-2 font-medium text-white">Log out</button>
                ]
              : modalType === 'privacy' || modalType === 'support' || modalType === 'settings'
                ? [
                    <button key="close" type="button" onClick={() => setModalType(null)} className="rounded-full bg-[#4CAF50] px-4 py-2 font-medium text-white">Close</button>
                  ]
                : [
                    <button key="cancel" type="button" onClick={() => setModalType(null)} className="rounded-full bg-[#edf5e6] px-4 py-2 font-medium text-darkgreen">Cancel</button>,
                    <button key="save" type="button" onClick={modalType === 'preferences' ? handleSavePreferences : handleSaveProfile} className="rounded-full bg-[#4CAF50] px-4 py-2 font-medium text-white">Save</button>
                  ]
          }
        >
          {modalType === 'personal' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-darkgreen">Name</label>
                <input id="profile-name" aria-label="Name" value={draft.name || ''} onChange={(event) => updateDraft({ name: event.target.value })} className="w-full rounded-2xl border border-[#dfe7d5] bg-white px-3 py-3 text-darkgreen focus:outline-none" />
              </div>
              <div>
                <label htmlFor="profile-level" className="mb-2 block text-sm font-medium text-darkgreen">Level</label>
                <input id="profile-level" aria-label="Level" value={draft.level || ''} onChange={(event) => updateDraft({ level: event.target.value })} className="w-full rounded-2xl border border-[#dfe7d5] bg-white px-3 py-3 text-darkgreen focus:outline-none" />
              </div>
              <div>
                <label htmlFor="diet-preference" className="mb-2 block text-sm font-medium text-darkgreen">Diet Preference</label>
                <select id="diet-preference" aria-label="Diet Preference" value={draft.preferences?.dietPreference || 'Vegetarian'} onChange={(event) => updateDraft({ preferences: { dietPreference: event.target.value } })} className="w-full rounded-2xl border border-[#dfe7d5] bg-white px-3 py-3 text-darkgreen focus:outline-none">
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-vegetarian">Non-vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Pescatarian">Pescatarian</option>
                </select>
              </div>
            </div>
          )}

          {modalType === 'preferences' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="diet" className="mb-2 block text-sm font-medium text-darkgreen">Diet Preference</label>
                <select id="diet" aria-label="Diet preference" value={draft.preferences?.dietPreference || 'Vegetarian'} onChange={(event) => updateDraft({ preferences: { dietPreference: event.target.value } })} className="w-full rounded-2xl border border-[#dfe7d5] bg-white px-3 py-3 text-darkgreen focus:outline-none">
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-vegetarian">Non-vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Pescatarian">Pescatarian</option>
                </select>
              </div>
              <div>
                <label htmlFor="calorie-goal" className="mb-2 block text-sm font-medium text-darkgreen">Daily Calorie Goal</label>
                <input id="calorie-goal" aria-label="Daily calorie goal" type="number" value={draft.preferences?.dailyCalorieGoal || 1600} onChange={(event) => updateDraft({ preferences: { dailyCalorieGoal: Number(event.target.value) || 0 } })} className="w-full rounded-2xl border border-[#dfe7d5] bg-white px-3 py-3 text-darkgreen focus:outline-none" />
              </div>
              <div>
                <label htmlFor="activity-level" className="mb-2 block text-sm font-medium text-darkgreen">Activity Level</label>
                <select id="activity-level" aria-label="Activity level" value={draft.preferences?.activityLevel || 'Moderate'} onChange={(event) => updateDraft({ preferences: { activityLevel: event.target.value } })} className="w-full rounded-2xl border border-[#dfe7d5] bg-white px-3 py-3 text-darkgreen focus:outline-none">
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="water-goal" className="mb-2 block text-sm font-medium text-darkgreen">Water Goal</label>
                <input id="water-goal" aria-label="Water goal" type="number" min="1" value={draft.preferences?.waterGoal || 8} onChange={(event) => updateDraft({ preferences: { waterGoal: Number(event.target.value) || 0 } })} className="w-full rounded-2xl border border-[#dfe7d5] bg-white px-3 py-3 text-darkgreen focus:outline-none" />
              </div>
            </div>
          )}

          {modalType === 'notifications' && (
            <div className="space-y-4">
              {[
                { key: 'dailyNutritionReminder', label: 'Daily nutrition reminder' },
                { key: 'goalReminders', label: 'Goal reminders' },
                { key: 'hydrationReminders', label: 'Hydration reminders' }
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-2xl bg-[#edf5e6] p-3 text-darkgreen">
                  <span className="font-medium">{item.label}</span>
                  <input type="checkbox" aria-label={item.label} checked={Boolean(draft.notifications?.[item.key])} onChange={(event) => updateDraft({ notifications: { [item.key]: event.target.checked } })} className="h-5 w-5 accent-[#4CAF50]" />
                </label>
              ))}
            </div>
          )}

          {modalType === 'privacy' && (
            <div className="space-y-4 text-base leading-7 text-gray-700">
              <p>NutriOwl stores your profile and progress in your browser using localStorage so the app works without a backend.</p>
              <p>Your data stays on this device. It is not stored on a secure remote server in this frontend-only version.</p>
              <p>We do not claim that the data is encrypted or protected beyond the browser&apos;s normal local storage safeguards.</p>
            </div>
          )}

          {modalType === 'support' && (
            <div className="space-y-4 text base text-gray-700">
              <div className="rounded-2xl bg-[#edf5e6] p-3">
                <div className="font-semibold text-darkgreen">How NutriOwl works</div>
                <p className="mt-1">Track goals, food scans, hydration and progress in one place.</p>
              </div>
              <div className="rounded-2xl bg-[#edf5e6] p-3">
                <div className="font-semibold text-darkgreen">How Food Scanner works</div>
                <p className="mt-1">Scan a meal to get a nutrition snapshot and log it against your profile.</p>
              </div>
              <div className="rounded-2xl bg-[#edf5e6] p-3">
                <div className="font-semibold text-darkgreen">How Goals work</div>
                <p className="mt-1">Set daily or weekly goals and update progress as you move through the week.</p>
              </div>
              <div className="rounded-2xl bg-[#edf5e6] p-3">
                <div className="font-semibold text-darkgreen">How Chat works</div>
                <p className="mt-1">Ask quick nutrition questions and stay motivated with helpful guidance.</p>
              </div>
              <div className="rounded-2xl bg-[#edf5e6] p-3">
                <div className="font-semibold text-darkgreen">Support</div>
                <p className="mt-1">For help, continue using the in-app guidance and nutrition tracking tools.</p>
              </div>
            </div>
          )}

          {modalType === 'settings' && (
            <div className="space-y-4">
              <button onClick={() => openModal('personal')} className="flex w-full items-center justify-between rounded-2xl bg-[#edf5e6] p-3 text-left font-medium text-darkgreen">
                <span>Profile details</span>
                <FiChevronRight />
              </button>
              <button onClick={() => openModal('preferences')} className="flex w-full items-center justify-between rounded-2xl bg-[#edf5e6] p-3 text-left font-medium text-darkgreen">
                <span>Preferences</span>
                <FiChevronRight />
              </button>
              <button onClick={() => openModal('notifications')} className="flex w-full items-center justify-between rounded-2xl bg-[#edf5e6] p-3 text-left font-medium text-darkgreen">
                <span>Notifications</span>
                <FiChevronRight />
              </button>
            </div>
          )}

          {modalType === 'logout' && (
            <div className="space-y-4 text-center text-gray-700">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5e6] text-2xl text-darkgreen">
                <FiLogOut />
              </div>
              <p className="text-lg font-medium text-darkgreen">Are you sure you want to log out?</p>
              <p className="text-sm text-gray-600">This closes your current app session in this browser, but keeps your local nutrition data saved.</p>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}
