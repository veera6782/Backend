import { randomUUID } from 'node:crypto';

const currentDate = () => new Date().toISOString().slice(0, 10);

export const defaultGoalItems = [
  { id: 'scan', title: 'Scan a meal', type: 'count', unit: 'meal scanned', target: 1, progress: 0, daily: true },
  { id: 'protein', title: 'Eat enough proteins', type: 'number', unit: 'g', target: 50, progress: 0, daily: true },
  { id: 'fruits', title: 'Eat 2 fruits', type: 'count', unit: 'servings', target: 2, progress: 0, daily: true },
  { id: 'water', title: 'Drink 6 glasses of water', type: 'count', unit: 'glasses', target: 6, progress: 0, daily: true },
  { id: 'active', title: 'Be active 5 days this week', type: 'count', unit: 'days', target: 5, progress: 0, daily: false },
  { id: 'healthyMeals', title: 'Make healthy food choices', type: 'count', unit: 'healthy meals', target: 20, progress: 0, daily: false }
];

function defaultProfile(email) {
  return {
    name: 'NutriOwl Member',
    email,
    age: null,
    heightCm: null,
    weightKg: null,
    activityLevel: 'moderate',
    goal: 'balanced',
    goals: [],
    onboardingCompleted: false,
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
    streak: 0,
    points: 0,
    goalsSet: defaultGoalItems.length,
    mealsScanned: 0,
    weeklyActivity: {},
    progress: {}
  };
}

function defaultGoals(profile, now) {
  const fruitPreference = { servings: 2 };
  const hydrationReminder = 9;
  return {
    userId: profile.email,
    activityLevel: profile.activityLevel,
    primaryGoal: profile.goal,
    fruitPreference,
    hydrationReminder,
    wellnessPlan: buildWellnessPlan(profile, fruitPreference.servings, hydrationReminder, now),
    lastDailyReset: currentDate(),
    createdAt: now,
    updatedAt: now
  };
}

export function buildWellnessPlan(profile, fruitServings, hydrationReminder, now = new Date()) {
  const activity = String(profile.preferences?.activityLevel || profile.activityLevel || 'moderate').toLowerCase();
  const goal = String(profile.goal || profile.goals?.[0] || 'balanced').toLowerCase();
  const activityHabit = activity.includes('high')
    ? 'Include enough meals, hydration and recovery foods around active days.'
    : activity.includes('moderate')
      ? 'Keep regular meals and snacks available to fuel everyday activity.'
      : 'Add gradual everyday movement, such as walking, play or active breaks.';
  const goalHabit = /weight|fat|loss/.test(goal)
    ? 'Because you are still growing, discuss nutrition or weight goals with a parent or guardian and a qualified healthcare professional.'
    : /strength|performance/.test(goal)
      ? 'Choose regular protein-containing foods and balanced recovery meals.'
      : /energy/.test(goal)
        ? 'Regular meals, snacks and hydration can support steady energy.'
        : 'Build variety by including different foods across the day.';

  return {
    breakfast: ['Whole grain or starch', 'Fruit', 'Eggs, yogurt, beans, paneer or tofu', 'Milk or a suitable alternative'],
    morningSnack: ['Fruit or vegetables', 'Yogurt, nuts, seeds or another protein-containing food'],
    lunch: ['Grain or starch', 'Vegetables', 'Beans, lentils, paneer, tofu, fish or chicken where appropriate', 'Fruit'],
    afternoonSnack: ['A fruit or vegetable option', 'Whole-grain food with yogurt, hummus, nuts or seeds'],
    dinner: ['Grain or starch', 'Vegetables', 'A protein-containing food', 'A healthy fat source such as avocado, olive oil, nuts or seeds'],
    fruitServings: Number(fruitServings),
    hydration: `Hydration reminder: ${hydrationReminder} glasses. Drink regularly and more during heat or activity.`,
    activityHabit: `${activityHabit} ${goalHabit}`,
    tips: ['Try different colors and food groups through the week.', 'Avoid skipping meals; ask a trusted adult for help with food choices.', 'These are general wellness ideas, not medical advice.'],
    generatedAt: new Date(now).toISOString()
  };
}

export function ensureUser(database, email) {
  const now = new Date().toISOString();
  const existing = database.users[email];
  if (!existing) {
    const profile = defaultProfile(email);
    database.users[email] = {
      profile,
      goals: defaultGoals(profile, now),
      goalItems: defaultGoalItems.map(goal => ({ ...goal })),
      scans: []
    };
    return database.users[email];
  }

  const defaults = defaultProfile(email);
  const profile = { ...defaults, ...(existing.profile || {}), email };
  profile.preferences = { ...defaults.preferences, ...(existing.profile?.preferences || {}) };
  profile.notifications = { ...defaults.notifications, ...(existing.profile?.notifications || {}) };
  const goals = { ...defaultGoals(profile, now), ...(existing.goals || {}) };
  goals.fruitPreference = { servings: 2, ...(existing.goals?.fruitPreference || {}) };
  goals.lastDailyReset ||= currentDate();
  goals.wellnessPlan ||= buildWellnessPlan(profile, goals.fruitPreference.servings, goals.hydrationReminder);

  existing.profile = profile;
  existing.goals = goals;
  existing.goalItems = Array.isArray(existing.goalItems) && existing.goalItems.length
    ? existing.goalItems
    : defaultGoalItems.map(goal => ({ ...goal }));
  existing.scans = Array.isArray(existing.scans) ? existing.scans : [];
  return existing;
}

export function resetDailyGoals(user) {
  const date = currentDate();
  if (user.goals.lastDailyReset === date) return;
  user.goalItems = user.goalItems.map(goal => ({ ...goal, progress: goal.daily ? 0 : goal.progress }));
  user.goals.lastDailyReset = date;
  user.goals.updatedAt = new Date().toISOString();
}

export function updateProfile(user, input, email) {
  const old = user.profile;
  const inputEmail = String(input.email ?? email).trim().toLowerCase();
  if (inputEmail !== email) throw Object.assign(new Error('Profile email does not match the current user.'), { status: 400 });

  const preferences = { ...old.preferences, ...(input.preferences || {}) };
  const goals = Array.isArray(input.goals)
    ? input.goals.filter(goal => typeof goal === 'string')
    : old.goals;
  const next = {
    ...old,
    ...input,
    name: String(input.name ?? old.name).trim(),
    email,
    age: optionalNumber(input.age, old.age),
    heightCm: optionalNumber(input.heightCm ?? input.height, old.heightCm),
    weightKg: optionalNumber(input.weightKg ?? input.weight, old.weightKg),
    activityLevel: String(input.activityLevel || preferences.activityLevel || old.activityLevel).trim(),
    goal: String(input.goal || goals[0] || old.goal || 'balanced').trim(),
    goals,
    onboardingCompleted: input.onboardingCompleted === undefined ? old.onboardingCompleted : Boolean(input.onboardingCompleted),
    preferences,
    notifications: { ...old.notifications, ...(input.notifications || {}) },
    updatedAt: new Date().toISOString()
  };

  if (!next.name) throw Object.assign(new Error('Profile name is required.'), { status: 400 });
  if (next.age !== null && (next.age < 1 || next.age > 120)) throw Object.assign(new Error('Age must be between 1 and 120.'), { status: 400 });
  if (next.heightCm !== null && (next.heightCm <= 30 || next.heightCm > 300)) throw Object.assign(new Error('Height must be between 30 and 300 cm.'), { status: 400 });
  if (next.weightKg !== null && (next.weightKg <= 10 || next.weightKg > 600)) throw Object.assign(new Error('Weight must be between 10 and 600 kg.'), { status: 400 });

  user.profile = next;
  user.goals.activityLevel = next.activityLevel;
  user.goals.primaryGoal = next.goal;
  user.goals.wellnessPlan = buildWellnessPlan(next, user.goals.fruitPreference.servings, user.goals.hydrationReminder);
  user.goals.updatedAt = next.updatedAt;
  return next;
}

function optionalNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback ?? null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw Object.assign(new Error('Numeric profile fields must be valid numbers.'), { status: 400 });
  return number;
}

export function goalsResponse(user) {
  return { ...user.goals, goals: user.goalItems };
}

export function updateGoal(user, id, input) {
  const goal = user.goalItems.find(item => item.id === id);
  if (!goal) throw Object.assign(new Error('Goal not found.'), { status: 404 });

  if (input.target !== undefined) {
    const target = Number(input.target);
    if (!Number.isFinite(target) || target < 1) throw Object.assign(new Error('Goal target must be a positive number.'), { status: 400 });
    goal.target = target;
    goal.progress = Math.min(goal.progress || 0, target);
  } else if (input.increment !== undefined) {
    const increment = Number(input.increment);
    if (!Number.isFinite(increment) || increment < 0) throw Object.assign(new Error('Goal increment must be a non-negative number.'), { status: 400 });
    goal.progress = Math.min(goal.target, (goal.progress || 0) + increment);
  } else {
    throw Object.assign(new Error('Provide either target or increment.'), { status: 400 });
  }

  user.goals.updatedAt = new Date().toISOString();
  return goalsResponse(user);
}

export function updateGoalPreferences(user, input) {
  const preferenceInput = input.fruitPreference || {};
  const servings = Number(preferenceInput.servings ?? user.goals.fruitPreference.servings);
  if (!Number.isInteger(servings) || servings < 1 || servings > 10) {
    throw Object.assign(new Error('Fruit servings must be an integer from 1 to 10.'), { status: 400 });
  }

  const hydrationReminder = Number(input.hydrationReminder ?? user.goals.hydrationReminder);
  if (!Number.isInteger(hydrationReminder) || hydrationReminder < 1 || hydrationReminder > 30) {
    throw Object.assign(new Error('Hydration reminder must be an integer from 1 to 30.'), { status: 400 });
  }

  user.goals.fruitPreference = { servings };
  user.goals.hydrationReminder = hydrationReminder;
  user.goalItems = user.goalItems.map(goal => goal.id === 'fruits'
    ? { ...goal, target: servings, title: `Eat ${servings} fruits` }
    : goal.id === 'water'
      ? { ...goal, target: hydrationReminder, title: `Drink ${hydrationReminder} glasses of water` }
      : goal);
  user.goals.wellnessPlan = buildWellnessPlan(user.profile, servings, hydrationReminder);
  user.goals.updatedAt = new Date().toISOString();
  return goalsResponse(user);
}

export function addScan(user, input) {
  const name = String(input.name || input.food || '').trim();
  if (!name) throw Object.assign(new Error('Scan name is required.'), { status: 400 });

  const scan = {
    id: String(input.id || randomUUID()),
    name: name.slice(0, 120),
    calories: nonNegativeNumber(input.calories),
    protein: nonNegativeNumber(input.protein),
    carbs: nonNegativeNumber(input.carbs ?? input.carbohydrates),
    fats: nonNegativeNumber(input.fats ?? input.fat),
    timestamp: validDate(input.timestamp) || new Date().toISOString(),
    image: safeImageReference(input.image)
  };

  user.scans = [scan, ...user.scans.filter(item => item.id !== scan.id)].slice(0, 200);
  user.profile.mealsScanned = user.scans.length;
  const scanGoal = user.goalItems.find(goal => goal.id === 'scan');
  if (scanGoal) scanGoal.progress = Math.min(scanGoal.target, (scanGoal.progress || 0) + 1);
  return scan;
}

function nonNegativeNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeImageReference(value) {
  const image = String(value || '').trim();
  if (!image || image.startsWith('data:')) return '/placeholder1.jpg';
  return image.slice(0, 2048);
}

export function demoFoodAnalysis() {
  return {
    isSample: true,
    food: 'Chicken Salad',
    calories: 420,
    protein: 32,
    carbs: 18,
    fat: 15,
    sugar: 6,
    sodium: 680,
    fiber: 8,
    vitamins: ['Vitamin A', 'Vitamin C', 'Vitamin K'],
    minerals: ['Iron', 'Calcium', 'Potassium'],
    healthScore: 91
  };
}

export function chatResponse(text) {
  const message = String(text || '').trim().toLowerCase();
  if (!message) throw Object.assign(new Error('Message text is required.'), { status: 400 });
  if (/protein/.test(message)) return 'High-protein choices include eggs, chicken or fish, paneer or tofu, lentils and beans, Greek yogurt, nuts and seeds. Choose options that fit your diet.';
  if (/snack/.test(message)) return 'Try fruit with yogurt, vegetables with hummus, nuts and seeds, or whole-grain crackers with cheese. Combining protein and fiber can help you feel full.';
  if (/fruit/.test(message)) return 'Fruits such as berries, apples, bananas, oranges, mango and papaya add variety, vitamins and fiber. Fresh, frozen, or fruit canned in juice can all work.';
  if (/vegetable|veggie/.test(message)) return 'Try including a variety of vegetables: leafy greens, broccoli, peppers, carrots, and other colorful choices. Steamed, roasted or raw options all count.';
  if (/water|hydr|drink/.test(message)) return 'A common guideline is about 6–8 cups (1.5–2 liters) of water per day for many adults, but needs vary with activity, climate and body size.';
  if (/breakfast|morning/.test(message)) return 'A balanced breakfast might pair a protein such as eggs, yogurt or tofu with whole grains and fruit or vegetables.';
  if (/lunch/.test(message)) return 'For lunch, try a protein such as legumes, tofu, chicken or fish with whole grains and plenty of vegetables.';
  if (/dinner|supper/.test(message)) return 'A balanced dinner can include a protein-containing food, grains or another starch, vegetables, and a source of healthy fats.';
  if (/vitamin/.test(message)) return 'A varied diet with fruits, vegetables, whole grains, protein foods and dairy or alternatives helps provide many vitamins. Ask a healthcare professional about supplements.';
  if (/mineral/.test(message)) return 'Calcium, iron, potassium and magnesium are found across foods such as dairy, legumes, leafy greens, nuts, seeds and whole grains.';
  if (/carb|carbohydrate/.test(message)) return 'Carbohydrates are an important energy source. Whole grains, fruits, vegetables and legumes also provide fiber and other nutrients.';
  if (/fat/.test(message)) return 'Foods such as olive oil, avocados, nuts, seeds and fatty fish provide unsaturated fats. Aim for variety across your meals.';
  if (/fiber|fibre/.test(message)) return 'Whole grains, legumes, fruits, vegetables, nuts and seeds are useful sources of dietary fiber.';
  if (/calorie/.test(message)) return 'Calorie needs vary with age, body size and activity. For personal nutrition targets, consult a qualified healthcare professional.';
  return 'I can help with nutrition and healthy eating. Try asking about protein, snacks, fruits, vegetables, hydration, or balanced meals.';
}