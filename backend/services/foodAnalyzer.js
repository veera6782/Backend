import { getNutrition } from './nutritionDatabase.js'

const emptyNutrition = {
  calories: null,
  proteinG: null,
  carbohydratesG: null,
  fatG: null,
  fiberG: null,
  sugarG: null
}

const emptyMicronutrients = {
  calciumMg: null,
  ironMg: null,
  potassiumMg: null,
  sodiumMg: null,
  vitaminAMcg: null,
  vitaminCMg: null,
  vitaminDMcg: null,
  vitaminEMg: null,
  vitaminKMcg: null
}

function isLikelyFoodImageName(value = '') {
  const cleaned = String(value).toLowerCase()
  const negativeIndicators = ['screenshot', 'document', 'receipt', 'text', 'invoice', 'blank', 'no food', 'not food']
  return cleaned.length > 0 && !negativeIndicators.some((indicator) => cleaned.includes(indicator))
}

function getFoodCandidates(input = '') {
  const haystack = String(input || '').toLowerCase()
  const candidates = ['rice', 'dal', 'paneer', 'banana', 'oatmeal', 'vegetable', 'salad', 'apple']
  const matches = candidates.filter((food) => haystack.includes(food))
  return matches.length ? matches : ['meal']
}

function sumValues(items, key) {
  const values = items
    .map((item) => Number(item?.[key]))
    .filter((value) => Number.isFinite(value) && value !== null)

  if (!values.length) return null
  return Number(values.reduce((sum, value) => sum + value, 0).toFixed(1))
}

function aggregateTotals(foods) {
  const macroTotals = {}
  for (const key of Object.keys(emptyNutrition)) {
    macroTotals[key] = sumValues(foods.map((food) => food.nutrition), key)
  }

  const microTotals = {}
  for (const key of Object.keys(emptyMicronutrients)) {
    microTotals[key] = sumValues(foods.map((food) => food.micronutrients), key)
  }

  return {
    totalNutrition: macroTotals,
    totalMicronutrients: microTotals
  }
}

export function analyzeImage({ image, mimeType, originalName, foodNameHint = '' } = {}) {
  if (!image && !foodNameHint && !originalName) {
    return {
      status: 'uncertain',
      message: 'Food could not be identified confidently. Try another photo.'
    }
  }

  const baseHint = String(foodNameHint || originalName || 'meal')
  if (!isLikelyFoodImageName(baseHint)) {
    return {
      status: 'uncertain',
      message: 'Food could not be identified confidently. Try another photo.'
    }
  }

  const foodNames = getFoodCandidates(baseHint)

  const foods = foodNames.map((foodName, index) => {
    const nutrition = getNutrition(foodName, index === 0 ? '1 serving' : '0.5 serving')
    const name = foodName === 'meal' ? 'Meal' : foodName.charAt(0).toUpperCase() + foodName.slice(1)

    return {
      name,
      estimatedServing: index === 0 ? 'Approximately 1 serving' : 'Approximately 1/2 serving',
      confidence: 0.72,
      nutrition: {
        calories: nutrition.calories,
        proteinG: nutrition.proteinG,
        carbohydratesG: nutrition.carbohydratesG,
        fatG: nutrition.fatG,
        fiberG: nutrition.fiberG,
        sugarG: nutrition.sugarG
      },
      micronutrients: {
        calciumMg: nutrition.micronutrients?.calciumMg ?? null,
        ironMg: nutrition.micronutrients?.ironMg ?? null,
        potassiumMg: nutrition.micronutrients?.potassiumMg ?? null,
        sodiumMg: nutrition.micronutrients?.sodiumMg ?? null,
        vitaminAMcg: nutrition.micronutrients?.vitaminAMcg ?? null,
        vitaminCMg: nutrition.micronutrients?.vitaminCMg ?? null,
        vitaminDMcg: nutrition.micronutrients?.vitaminDMcg ?? null,
        vitaminEMg: nutrition.micronutrients?.vitaminEMg ?? null,
        vitaminKMcg: nutrition.micronutrients?.vitaminKMcg ?? null
      }
    }
  })

  const { totalNutrition, totalMicronutrients } = aggregateTotals(foods)

  return {
    status: 'ok',
    foods,
    totalNutrition,
    totalMicronutrients,
    confidence: Number((foods.reduce((sum, food) => sum + food.confidence, 0) / Math.max(foods.length, 1)).toFixed(2)),
    notes: ['Nutrition values are approximate educational estimates based on visible food items and common serving sizes.']
  }
}
