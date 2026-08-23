const KEYWORDS = {
  protein: ['protein', 'high protein', 'proteins', 'protein foods', 'protein-rich'],
  snacks: ['snack', 'snacks', 'healthy snacks'],
  fruits: ['fruit', 'fruits'],
  vegetables: ['vegetable', 'vegetables', 'veggies'],
  hydration: ['water', 'hydrate', 'hydration'],
  breakfast: ['breakfast', 'morning meal'],
  lunch: ['lunch'],
  dinner: ['dinner', 'supper'],
  vitamins: ['vitamin', 'vitamins'],
  minerals: ['mineral', 'minerals'],
  carbs: ['carbohydrate', 'carbs', 'carbohydrates'],
  fats: ['fat', 'fats'],
  fiber: ['fiber', 'fibre', 'fibrous'],
  exercise_before: ['before exercise', 'pre-workout', 'eat before exercise'],
  exercise_after: ['after exercise', 'post-workout', 'eat after exercise'],
  scanned: ['scanned', 'scans', 'scan'],
  calories: ['calorie', 'calories', 'calorie needs', 'calorie intake'],
  meal_ideas: ['meal ideas', 'meal idea', 'what to eat', 'dinner ideas', 'lunch ideas']
};

function normalizeText(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchCategory(text) {
  if (!text) return null;
  const t = normalizeText(text);
  for (const [cat, keys] of Object.entries(KEYWORDS)) {
    for (const k of keys) {
      const nk = normalizeText(k);
      if (!nk) continue;
      if (t.includes(nk)) return cat;
      // also try word-by-word match for short keywords
      const words = nk.split(' ');
      if (words.length === 1 && t.split(' ').includes(nk)) return cat;
    }
  }
  return null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getNutriOwlResponse(userText) {
  // simulate thinking delay
  await delay(600 + Math.random() * 800);

  const cat = matchCategory(userText);
  if (!cat) {
    return `I can help with nutrition and healthy eating — try asking about protein, healthy snacks, fruits, vegetables, hydration, or balanced meals. If you scanned a food, tell me its name and I'll help explain it!`;
  }

  switch (cat) {
    case 'protein':
      return `Great question! Here are some high-protein foods you can include in your meals: eggs, chicken or fish (if you eat animal products), paneer or tofu, lentils and beans, Greek yogurt and dairy, and nuts & seeds. Combine plant proteins (like grains + legumes) for a complete amino acid profile.`;
    case 'snacks':
      return `Healthy snack ideas: apple slices with nut butter, yogurt with berries, carrot sticks and hummus, a small handful of nuts and seeds, whole-grain crackers with cheese, or a boiled egg. Choose snacks that combine protein + fiber for longer fullness.`;
    case 'fruits':
      return `Fruits are great for vitamins and fiber. Try berries, apples, bananas, oranges, mango, papaya and stone fruits. Fresh, frozen, or canned (in juice) are fine — watch added sugars.`;
    case 'vegetables':
      return `Aim to fill half your plate with vegetables. Include leafy greens (spinach, kale), cruciferous veg (broccoli, cauliflower), colorful choices (bell peppers, carrots), and starchy veg (sweet potato). Steamed, roasted or raw with dips are all good.`;
    case 'hydration':
      return `A common guideline is about 6–8 cups (1.5–2 liters) per day for many adults, but needs vary with activity, climate, and body size. Drink more when exercising or in hot weather. Listen to thirst and check urine colour (pale is good).`;
    case 'breakfast':
      return `A balanced breakfast could include a protein (eggs, yogurt, or paneer/tofu), whole grains (oats or whole-grain toast), and fruit or vegetables. For example: scrambled eggs with spinach and whole-grain toast, plus a piece of fruit.`;
    case 'lunch':
      return `For lunch, aim for a balanced plate: lean protein (chicken, fish, legumes), whole grains (brown rice, quinoa), and plenty of vegetables or salad. Add healthy fats like avocado or olive oil and a piece of fruit for dessert.`;
    case 'dinner':
      return `Dinner idea: grilled fish or tofu, a portion of whole grains (rice, quinoa), and roasted vegetables. Keep portions moderate and include fiber-rich veggies to aid digestion.`;
    case 'vitamins':
      return `Vitamins are best obtained from a varied diet rich in fruits, vegetables, whole grains, lean proteins and dairy. Specific needs vary — consider a multivitamin only if recommended by a healthcare professional.`;
    case 'minerals':
      return `Important minerals include calcium (dairy, leafy greens), iron (red meat, lentils, spinach), potassium (bananas, potatoes), and magnesium (nuts, seeds, whole grains). Variety helps meet needs.`;
    case 'carbs':
      return `Carbohydrates are the body’s main energy source. Prefer whole grains, fruits, vegetables and legumes over refined sugars and white flour. Balance carbs with protein and healthy fats.`;
    case 'fats':
      return `Healthy fats (olive oil, avocados, nuts, seeds, fatty fish) are important for brain and cell health. Limit trans fats and excessive saturated fats.`;
    case 'fiber':
      return `Fiber supports digestion and fullness. Include whole grains, legumes, fruits, vegetables, nuts and seeds. Aim for a mix of soluble and insoluble fiber across meals.`;
    case 'exercise_before':
      return `Before exercise, choose a light meal or snack with carbs and some protein — e.g., banana with peanut butter, or yogurt and fruit — 30–90 minutes before activity depending on tolerance.`;
    case 'exercise_after':
      return `After exercise, focus on protein + carbs to aid recovery: a smoothie with protein powder and banana, yogurt with fruit, or chicken with rice and vegetables within a couple hours.`;
    case 'scanned':
      return `If you tell me the food name or what the scanner showed, I can help explain its nutrition — calories, macronutrients, or healthier alternatives.`;
    case 'calories':
      return `Calorie needs vary by age, sex, body size and activity level. A rough adult range is 1,800–2,500 kcal per day for many people, but individual needs can be higher or lower. For personalised guidance consider talking to a dietitian.`;
    case 'meal_ideas':
      return `Meal ideas: Breakfast - oats with milk/yogurt, fruit and nuts; Lunch - grain bowl with legumes or chicken, roasted veg and a simple dressing; Dinner - baked fish or tofu, quinoa and steamed greens. Swap ingredients to match your preferences.`;
    default:
      return `I can help with nutrition and healthy eating — try asking about protein, healthy snacks, fruits, vegetables, hydration, or balanced meals.`;
  }
}

export default { getNutriOwlResponse };
