import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env') })

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI?.trim()
  if (!mongoUri) throw new Error('MONGODB_URI is not configured. Copy backend/.env.example to backend/.env.')
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) throw new Error('MONGODB_URI is invalid.')
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
  console.log('Connected to MongoDB')
}
