import mongoose from 'mongoose'
import User from '../models/User.js'

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    age: user.age,
    height: user.height,
    weight: user.weight,
    activityLevel: user.activityLevel,
    goals: user.goals,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

function isValidUserId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function validatedProfile(body = {}) {
  const profile = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    age: Number(body.age),
    height: Number(body.height),
    weight: Number(body.weight),
    activityLevel: body.activityLevel,
    goals: Array.isArray(body.goals) ? body.goals : [],
    onboardingCompleted: body.onboardingCompleted === true
  }

  if (profile.name.length < 2) throw validationError('Name must be at least 2 characters')
  if (!/^\S+@\S+\.\S+$/.test(profile.email)) throw validationError('A valid email is required')
  if (!Number.isInteger(profile.age) || profile.age < 1 || profile.age > 120) throw validationError('Age must be a whole number between 1 and 120')
  if (!Number.isFinite(profile.height) || profile.height <= 30 || profile.height > 300) throw validationError('Height must be between 30 and 300 cm')
  if (!Number.isFinite(profile.weight) || profile.weight <= 10 || profile.weight > 600) throw validationError('Weight must be between 10 and 600 kg')
  if (!['low', 'moderate', 'high'].includes(profile.activityLevel)) throw validationError('A valid activity level is required')
  if (profile.goals.length === 0) throw validationError('Select at least one goal')

  return profile
}

function validationError(message) {
  const error = new Error(message)
  error.name = 'ValidationError'
  error.errors = { profile: { message } }
  return error
}

export async function createUser(req, res, next) {
  try {
    const user = await User.create(validatedProfile(req.body))
    res.status(201).json({ user: serializeUser(user) })
  } catch (error) {
    next(error)
  }
}

export async function getUser(req, res, next) {
  try {
    if (!isValidUserId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' })
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user: serializeUser(user) })
  } catch (error) {
    next(error)
  }
}

export async function updateUser(req, res, next) {
  try {
    if (!isValidUserId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' })
    const user = await User.findByIdAndUpdate(req.params.id, validatedProfile(req.body), { new: true, runValidators: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user: serializeUser(user) })
  } catch (error) {
    next(error)
  }
}
