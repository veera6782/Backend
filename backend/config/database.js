import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: resolve(backendDirectory, '.env') })

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI?.trim()

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is not configured. Copy backend/.env.example to backend/.env and add your MongoDB Atlas connection string.'
    )
  }

  if (
    !mongoUri.startsWith('mongodb://') &&
    !mongoUri.startsWith('mongodb+srv://')
  ) {
    throw new Error(
      'MONGODB_URI is invalid. It must start with mongodb:// or mongodb+srv://.'
    )
  }

  if (
    mongoUri.includes('your_mongodb_atlas_connection_string_here') ||
    mongoUri.includes('<username>') ||
    mongoUri.includes('<password>') ||
    mongoUri.includes('<cluster>')
  ) {
    throw new Error(
      'MONGODB_URI still contains a placeholder. Replace it in backend/.env with the connection string copied from MongoDB Atlas.'
    )
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
  } catch (error) {
    throw new Error(
      `MongoDB connection failed. Check the Atlas URI, database user, and Network Access allowlist. ${error.message}`
    )
  }

  console.log('Connected to MongoDB')
}
