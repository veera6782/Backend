// Placeholder service for food analysis. Returns mocked data.

export async function analyzeFood(image) {
  // Accept either File/Blob or data URL
  // Simulate network latency
  await new Promise(r => setTimeout(r, 1200));

  return {
    food: 'Chicken Salad',
    calories: 420,
    protein: 32,
    carbs: 18,
    fat: 15,
    fiber: 8,
    vitamins: ['Vitamin A', 'Vitamin C', 'Vitamin K'],
    minerals: ['Iron', 'Calcium', 'Potassium'],
    healthScore: 91
  };
}
