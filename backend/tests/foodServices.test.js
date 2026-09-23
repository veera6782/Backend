import test from 'node:test';
import assert from 'node:assert/strict';

import { getNutrition } from '../services/nutritionDatabase.js';
import { analyzeImage } from '../services/foodAnalyzer.js';

test('nutrition lookup returns object with calories and nutrient fields', () => {
  const result = getNutrition('rice', '1 cup');
  assert.ok(result.calories >= 0);
  assert.ok(typeof result.proteinG === 'number');
  assert.ok(typeof result.carbohydratesG === 'number');
});

test('food analysis produces a structured response for common foods', () => {
  const result = analyzeImage({ foodNameHint: 'rice and dal' });
  assert.equal(result.status, 'ok');
  assert.ok(Array.isArray(result.foods));
  assert.ok(result.foods.length > 0);
  assert.ok(result.totalNutrition && typeof result.totalNutrition.calories === 'number');
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
});
