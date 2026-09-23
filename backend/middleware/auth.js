import mongoose from 'mongoose'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const userId = req.get('x-user-id') || req.get('X-User-Id') || (
      req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null
    )

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(401).json({ message: 'Authenticated user not found.' })
    }

    req.user = { id: user._id.toString(), email: user.email, name: user.name }
    next()
  } catch (error) {
    next(error)
  }
}
