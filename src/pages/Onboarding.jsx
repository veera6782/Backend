import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OwlAssistant from '../components/OwlAssistant';
import profileService from '../services/profileService';

const initialForm = {
  name: '',
  email: '',
  age: '',
  height: '',
  weight: '',
  activityLevel: '',
  goal: '',
  onboardingCompleted: false
};

const activityOptions = [
  { key: 'low', title: 'Lightly Active', desc: 'Walking, casual activity, 10–15 min/day' },
  { key: 'moderate', title: 'Moderately Active', desc: 'Sports or active play regularly' },
  { key: 'high', title: 'Highly Active', desc: 'Frequent sports, training or vigorous activity' }
];

const goalOptions = [
  { key: 'balanced', title: 'Eat More Balanced', desc: 'Build healthier everyday eating habits' },
  { key: 'strength', title: 'Build Strength', desc: 'Support strength and active living' },
  { key: 'energy', title: 'More Energy', desc: 'Choose foods that support your daily activities' },
  { key: 'performance', title: 'Improve Sports Performance', desc: 'Fuel your activities and recovery' },
  { key: 'habits', title: 'Build Healthy Habits', desc: 'Create a balanced routine' }
];

function isValidEmail(val) {
  return /\S+@\S+\.\S+/.test(val || '');
}

function validate(form) {
  const nextErrors = {};

  if (!form.name || form.name.trim().length < 2) nextErrors.name = 'Please enter your name';
  if (!form.email) nextErrors.email = 'Please enter your email';
  else if (!isValidEmail(form.email)) nextErrors.email = 'Please enter a valid email address';

  if (!form.age) nextErrors.age = 'Please enter your age';
  else if (Number(form.age) <= 0 || Number(form.age) > 120) nextErrors.age = 'Please enter a sensible age';

  if (!form.height) nextErrors.height = 'Please enter your height';
  else if (Number(form.height) <= 30 || Number(form.height) > 300) nextErrors.height = 'Please enter a sensible height';

  if (!form.weight) nextErrors.weight = 'Please enter your weight';
  else if (Number(form.weight) <= 10 || Number(form.weight) > 600) nextErrors.weight = 'Please enter a sensible weight';

  if (!form.activityLevel) nextErrors.activityLevel = 'Please select your activity level';
  if (!form.goal) nextErrors.goal = 'Please select a goal';

  return nextErrors;
}

export default function Onboarding() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const existing = profileService.load();
    if (existing && existing.onboardingCompleted) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const canSubmit = useMemo(() => Object.keys(validate(form)).length === 0, [form]);

  function handleField(key, value) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (errors[key]) {
      setErrors({ ...errors, [key]: undefined });
    }
  }

  function handleBlur() {
    setErrors(validate(form));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const profile = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      onboardingCompleted: true
    };

    profileService.save(profile);
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-cream font-poppins text-darkgreen">
      <div className="mx-auto max-w-[420px] px-4 pb-8 pt-3">
        <div className="flex items-center justify-between px-1 pt-1 text-[15px] font-semibold text-darkgreen">
          <span>9:41</span>
          <div className="flex items-center gap-2 text-lg">
            <span>◔</span>
            <span>▣</span>
            <span>◍</span>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="absolute right-1 top-2 h-14 w-14 rounded-full bg-green-100/60 blur-sm" />
          <div className="absolute right-10 top-10 h-10 w-10 rounded-full bg-green-100/60 blur-sm" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 pt-2">
              <h1 className="text-[3rem] font-bold leading-[0.98] tracking-[-0.05em]">Let’s get to <br /> know you!</h1>
              <p className="mt-3 text-[16px] leading-6 text-gray-600">
                A few details will help NutriOwl <br /> personalize your experience.
              </p>
            </div>
            <div className="w-[180px] shrink-0">
              <OwlAssistant />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(46,94,62,0.08)] ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg shadow-inner">👤</div>
              <div className="flex-1">
                <label className="block text-[14px] font-semibold text-darkgreen">1. What’s your name?</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleField('name', e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter your name"
                  className="mt-2 w-full border-0 bg-transparent p-0 text-[16px] text-darkgreen placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
            {errors.name && <div className="mt-2 text-xs text-red-600">{errors.name}</div>}
          </div>

          <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(46,94,62,0.08)] ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg shadow-inner">✉️</div>
              <div className="flex-1">
                <label className="block text-[14px] font-semibold text-darkgreen">2. What’s your Gmail ID / Email?</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleField('email', e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter your Gmail ID"
                  className="mt-2 w-full border-0 bg-transparent p-0 text-[16px] text-darkgreen placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>
            {errors.email && <div className="mt-2 text-xs text-red-600">{errors.email}</div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(46,94,62,0.08)] ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg shadow-inner">🗓️</div>
                <div className="flex-1">
                  <label className="block text-[14px] font-semibold text-darkgreen">3. How old are you?</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.age}
                      onChange={(e) => handleField('age', e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={handleBlur}
                      placeholder="Enter your age"
                      className="w-full border-0 bg-transparent p-0 text-[16px] text-darkgreen placeholder:text-gray-400 focus:outline-none"
                    />
                    <span className="text-[12px] text-gray-500">years</span>
                  </div>
                </div>
              </div>
              {errors.age && <div className="mt-2 text-xs text-red-600">{errors.age}</div>}
            </div>

            <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(46,94,62,0.08)] ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg shadow-inner">📏</div>
                <div className="flex-1">
                  <label className="block text-[14px] font-semibold text-darkgreen">4. What’s your height?</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.height}
                      onChange={(e) => handleField('height', e.target.value.replace(/[^0-9.]/g, ''))}
                      onBlur={handleBlur}
                      placeholder="Enter your height"
                      className="w-full border-0 bg-transparent p-0 text-[16px] text-darkgreen placeholder:text-gray-400 focus:outline-none"
                    />
                    <span className="text-[12px] text-gray-500">cm</span>
                  </div>
                </div>
              </div>
              {errors.height && <div className="mt-2 text-xs text-red-600">{errors.height}</div>}
            </div>
          </div>

          <div className="rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(46,94,62,0.08)] ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg shadow-inner">⚖️</div>
              <div className="flex-1">
                <label className="block text-[14px] font-semibold text-darkgreen">5. What’s your weight?</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.weight}
                    onChange={(e) => handleField('weight', e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={handleBlur}
                    placeholder="Enter your weight"
                    className="w-full border-0 bg-transparent p-0 text-[16px] text-darkgreen placeholder:text-gray-400 focus:outline-none"
                  />
                  <span className="text-[12px] text-gray-500">kg</span>
                </div>
              </div>
            </div>
            {errors.weight && <div className="mt-2 text-xs text-red-600">{errors.weight}</div>}
          </div>

          <div className="pt-1">
            <label className="mb-3 block text-[14px] font-semibold text-darkgreen">6. What’s your daily activity level?</label>
            <div className="grid grid-cols-3 gap-3">
              {activityOptions.map((option) => {
                const selected = form.activityLevel === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleField('activityLevel', option.key)}
                    className={`rounded-[18px] border bg-white px-3 py-4 text-left shadow-[0_6px_18px_rgba(46,94,62,0.08)] transition ${selected ? 'border-green-300 bg-green-50' : 'border-[#dfe8da]'}`}
                  >
                    <div className="mb-3 flex h-16 items-center justify-center">
                      <span className="text-4xl">{option.key === 'low' ? '🐣' : option.key === 'moderate' ? '🦉' : '🏋️'}</span>
                    </div>
                    <div className="text-center text-[14px] font-semibold text-darkgreen">{option.title}</div>
                    <div className="mt-2 text-center text-[11px] leading-4 text-gray-600">{option.desc}</div>
                  </button>
                );
              })}
            </div>
            {errors.activityLevel && <div className="mt-2 text-xs text-red-600">{errors.activityLevel}</div>}
          </div>

          <div className="pt-1">
            <label className="mb-3 block text-[14px] font-semibold text-darkgreen">7. What’s your goal?</label>
            <div className="grid grid-cols-3 gap-3">
              {goalOptions.map((option, index) => {
                const selected = form.goal === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleField('goal', option.key)}
                    className={`rounded-[18px] border bg-white px-3 py-4 text-left shadow-[0_6px_18px_rgba(46,94,62,0.08)] transition ${selected ? 'border-green-300 bg-green-50' : 'border-[#dfe8da]'}`}
                  >
                    <div className="mb-3 flex h-16 items-center justify-center">
                      <span className="text-3xl">{['🥗', '💪', '⚡', '🏆', '🌱'][index]}</span>
                    </div>
                    <div className="text-center text-[14px] font-semibold leading-5 text-darkgreen">{option.title}</div>
                    <div className="mt-2 text-center text-[11px] leading-4 text-gray-600">{option.desc}</div>
                  </button>
                );
              })}
            </div>
            {errors.goal && <div className="mt-2 text-xs text-red-600">{errors.goal}</div>}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`mt-4 flex w-full items-center justify-center rounded-full bg-green-600 px-6 py-4 text-center text-[26px] font-bold text-white shadow-[0_10px_20px_rgba(76,175,80,0.25)] transition ${!canSubmit ? 'cursor-not-allowed bg-[#a9d9aa]' : 'hover:bg-green-700'}`}
          >
            <span>Continue</span>
            <span className="ml-3 text-2xl">→</span>
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 pb-4 text-[12px] text-gray-500">
          <span>🔒</span>
          <span>Your information is safe with NutriOwl</span>
        </div>
      </div>
    </div>
  );
}
