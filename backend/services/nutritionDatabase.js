const nutritionCatalog = {
  oatmeal: {
    calories: 150,
    proteinG: 5,
    carbohydratesG: 27,
    fatG: 3,
    fiberG: 4,
    sugarG: 1,
    micronutrients: { calciumMg: 20, ironMg: 1.5, potassiumMg: 150, sodiumMg: 0, vitaminAMcg: 0, vitaminCMg: 0, vitaminDMcg: 0, vitaminEMg: 0.1, vitaminKMcg: 0 }
  },
  banana: {
    calories: 105,
    proteinG: 1.3,
    carbohydratesG: 27,
    fatG: 0.3,
    fiberG: 3.1,
    sugarG: 14,
    micronutrients: { calciumMg: 5, ironMg: 0.3, potassiumMg: 358, sodiumMg: 1, vitaminAMcg: 0, vitaminCMg: 10, vitaminDMcg: 0, vitaminEMg: 0.1, vitaminKMcg: 0.5 }
  },
  rice: {
    calories: 205,
    proteinG: 4.3,
    carbohydratesG: 45,
    fatG: 0.4,
    fiberG: 0.6,
    sugarG: 0.1,
    micronutrients: { calciumMg: 19, ironMg: 0.8, potassiumMg: 163, sodiumMg: 1, vitaminAMcg: 0, vitaminCMg: 0, vitaminDMcg: 0, vitaminEMg: 0.1, vitaminKMcg: 0 }
  },
  dal: {
    calories: 230,
    proteinG: 16,
    carbohydratesG: 30,
    fatG: 5,
    fiberG: 10,
    sugarG: 2,
    micronutrients: { calciumMg: 60, ironMg: 2.2, potassiumMg: 480, sodiumMg: 18, vitaminAMcg: 0, vitaminCMg: 0, vitaminDMcg: 0, vitaminEMg: 0.2, vitaminKMcg: 0 }
  },
  paneer: {
    calories: 265,
    proteinG: 18,
    carbohydratesG: 6,
    fatG: 20,
    fiberG: 0,
    sugarG: 2,
    micronutrients: { calciumMg: 480, ironMg: 0.7, potassiumMg: 110, sodiumMg: 20, vitaminAMcg: 150, vitaminCMg: 0, vitaminDMcg: 0, vitaminEMg: 0.4, vitaminKMcg: 2 }
  },
  vegetable: {
    calories: 70,
    proteinG: 2,
    carbohydratesG: 15,
    fatG: 0.5,
    fiberG: 4,
    sugarG: 4,
    micronutrients: { calciumMg: 30, ironMg: 0.7, potassiumMg: 240, sodiumMg: 20, vitaminAMcg: 120, vitaminCMg: 25, vitaminDMcg: 0, vitaminEMg: 0.7, vitaminKMcg: 40 }
  },
  salad: {
    calories: 35,
    proteinG: 1,
    carbohydratesG: 6,
    fatG: 0.5,
    fiberG: 2,
    sugarG: 3,
    micronutrients: { calciumMg: 25, ironMg: 0.4, potassiumMg: 200, sodiumMg: 10, vitaminAMcg: 70, vitaminCMg: 8, vitaminDMcg: 0, vitaminEMg: 0.4, vitaminKMcg: 60 }
  },
  apple: {
    calories: 95,
    proteinG: 0.5,
    carbohydratesG: 25,
    fatG: 0.3,
    fiberG: 4.4,
    sugarG: 19,
    micronutrients: { calciumMg: 6, ironMg: 0.1, potassiumMg: 154, sodiumMg: 1, vitaminAMcg: 0, vitaminCMg: 6, vitaminDMcg: 0, vitaminEMg: 0.2, vitaminKMcg: 4 }
  }
}

const nutrientKeys = ['calories', 'proteinG', 'carbohydratesG', 'fatG', 'fiberG', 'sugarG']
const micronutrientKeys = ['calciumMg', 'ironMg', 'potassiumMg', 'sodiumMg', 'vitaminAMcg', 'vitaminCMg', 'vitaminDMcg', 'vitaminEMg', 'vitaminKMcg']

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function getNutrition(foodName, servingAmount = '1 serving') {
  const text = String(foodName || '').trim().toLowerCase()
  const lookup = Object.keys(nutritionCatalog).find((key) => text.includes(key))
  const base = lookup ? nutritionCatalog[lookup] : null

  if (!base) {
    return {
      calories: null,
      proteinG: null,
      carbohydratesG: null,
      fatG: null,
      fiberG: null,
      sugarG: null,
      micronutrients: Object.fromEntries(micronutrientKeys.map((key) => [key, null]))
    }
  }

  const servingFactor = (() => {
    const lower = String(servingAmount || '').toLowerCase()
    if (lower.includes('half') || lower.includes('1/2')) return 0.5
    if (lower.includes('two') || lower.includes('2 ')) return 2
    if (lower.includes('small')) return 0.75
    if (lower.includes('large')) return 1.5
    return 1
  })()

  const nutrition = {}
  nutrientKeys.forEach((key) => {
    nutrition[key] = Number((normalizeNumber(base[key], 0) * servingFactor).toFixed(1))
  })

  const micronutrients = {}
  micronutrientKeys.forEach((key) => {
    micronutrients[key] = Number((normalizeNumber(base.micronutrients[key], 0) * servingFactor).toFixed(1))
  })

  return {
    ...nutrition,
    micronutrients
  }
}
