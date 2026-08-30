import mongoose from 'mongoose'
import User from '../models/User.js'

function serializeUser(user) {
  return {
    id: user._id.toString(),
    age: user.age,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

function isValidUserId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function getValidatedAge(body) {
  const age = body && body.age

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    const error = new Error('Age must be a whole number between 1 and 120')
    error.name = 'ValidationError'
    error.errors = { age: { message: error.message } }
    throw error
  }

  return age
}

export async function createUser(req, res, next) {
  try {
    const user = await User.create({ age: getValidatedAge(req.body) })
    res.status(201).json({ user: serializeUser(user) })
  } catch (error) {
    next(error)
  }
}

export async function getUser(req, res, next) {
  try {
    if (!isValidUserId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user: serializeUser(user) })
  } catch (error) {
    next(error)
  }
}

export async function updateUser(req, res, next) {
  try {
    if (!isValidUserId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { age: getValidatedAge(req.body) },
      { new: true, runValidators: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user: serializeUser(user) })
  } catch (error) {
    next(error)
  }
}
