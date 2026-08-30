import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age must be 120 or less'],
      validate: {
        validator: Number.isInteger,
        message: 'Age must be a whole number'
      }
    }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
