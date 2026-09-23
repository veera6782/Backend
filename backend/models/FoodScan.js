import mongoose from 'mongoose'

const foodNutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: null },
    proteinG: { type: Number, default: null },
    carbohydratesG: { type: Number, default: null },
    fatG: { type: Number, default: null },
    fiberG: { type: Number, default: null },
    sugarG: { type: Number, default: null }
  },
  { _id: false }
)

const micronutrientSchema = new mongoose.Schema(
  {
    calciumMg: { type: Number, default: null },
    ironMg: { type: Number, default: null },
    potassiumMg: { type: Number, default: null },
    sodiumMg: { type: Number, default: null },
    vitaminAMcg: { type: Number, default: null },
    vitaminCMg: { type: Number, default: null },
    vitaminDMcg: { type: Number, default: null },
    vitaminEMg: { type: Number, default: null },
    vitaminKMcg: { type: Number, default: null }
  },
  { _id: false }
)

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    estimatedServing: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    nutrition: { type: foodNutritionSchema, default: () => ({}) },
    micronutrients: { type: micronutrientSchema, default: () => ({}) }
  },
  { _id: false }
)

const foodScanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageReference: { type: String, default: '' },
    foods: { type: [foodItemSchema], default: [] },
    totalNutrition: { type: foodNutritionSchema, default: () => ({}) },
    totalMicronutrients: { type: micronutrientSchema, default: () => ({}) },
    confidence: { type: Number, default: 0 },
    notes: { type: [String], default: [] },
    source: { type: String, default: 'camera' }
  },
  { timestamps: true }
)

foodScanSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('FoodScan', foodScanSchema)
