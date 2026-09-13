import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2 },
    email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true },
    age: { type: Number, required: [true, 'Age is required'], min: 1, max: 120 },
    height: { type: Number, required: [true, 'Height is required'], min: 30, max: 300 },
    weight: { type: Number, required: [true, 'Weight is required'], min: 10, max: 600 },
    activityLevel: { type: String, enum: ['low', 'moderate', 'high'], required: true },
    goals: { type: [String], required: true, validate: { validator: (value) => value.length > 0, message: 'Select at least one goal' } },
    onboardingCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
