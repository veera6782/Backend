import mongoose from 'mongoose'
import { analyzeImage } from '../services/foodAnalyzer.js'
import FoodScan from '../models/FoodScan.js'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function sanitizeScanRecord(scan) {
  return {
    id: scan._id.toString(),
    foods: scan.foods || [],
    totalNutrition: scan.totalNutrition || {},
    totalMicronutrients: scan.totalMicronutrients || {},
    confidence: scan.confidence || 0,
    notes: scan.notes || [],
    imageReference: scan.imageReference || '',
    createdAt: scan.createdAt,
    updatedAt: scan.updatedAt
  }
}

function validateImageUpload(file) {
  if (!file) {
    throw new Error('Please upload a valid food image.')
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new Error('Unsupported image type. Please upload JPG, PNG, or WebP.')
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image is too large. Please choose a file under 10MB.')
  }
}

function parseStructuredAnalysis(rawResult) {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('The food analysis response was malformed.')
  }

  if (rawResult.status === 'uncertain') {
    return {
      status: 'uncertain',
      message: rawResult.message || 'Food could not be identified confidently. Try another photo.'
    }
  }

  if (!Array.isArray(rawResult.foods) || rawResult.foods.length === 0) {
    throw new Error('The AI did not detect a food item in the image.')
  }

  const totalNutrition = rawResult.totalNutrition || {}
  const totalMicronutrients = rawResult.totalMicronutrients || {}

  return {
    status: 'ok',
    foods: rawResult.foods,
    totalNutrition,
    totalMicronutrients,
    confidence: typeof rawResult.confidence === 'number' ? rawResult.confidence : 0,
    notes: Array.isArray(rawResult.notes) ? rawResult.notes : []
  }
}

export async function analyzeFood(req, res, next) {
  try {
    const file = req.file
    validateImageUpload(file)

    const imageBuffer = file.buffer
    const mimeType = file.mimetype
    const originalName = file.originalname || 'food-image'

    const analysisInput = {
      image: imageBuffer,
      mimeType,
      originalName,
      foodNameHint: req.body?.foodNameHint || originalName
    }

    const analysis = parseStructuredAnalysis(analyzeImage(analysisInput))

    if (analysis.status === 'uncertain') {
      return res.status(422).json(analysis)
    }

    const scan = await FoodScan.create({
      userId: req.user.id,
      imageReference: `uploads/${Date.now()}-${originalName}`,
      foods: analysis.foods,
      totalNutrition: analysis.totalNutrition,
      totalMicronutrients: analysis.totalMicronutrients,
      confidence: analysis.confidence,
      notes: analysis.notes,
      source: 'camera'
    })

    return res.status(200).json({
      ...analysis,
      scanId: scan._id.toString(),
      createdAt: scan.createdAt
    })
  } catch (error) {
    if (error.message && /Unsupported image type|Please upload|too large|malformed|Food could not be identified|did not detect|valid food image/i.test(error.message)) {
      return res.status(400).json({ message: error.message })
    }
    next(error)
  }
}

export async function getRecentScans(req, res, next) {
  try {
    const scans = await FoodScan.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20)
    const records = scans.map(sanitizeScanRecord)
    res.json(records)
  } catch (error) {
    next(error)
  }
}

export async function getScanById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid scan id.' })
    }

    const scan = await FoodScan.findOne({ _id: req.params.id, userId: req.user.id })
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found.' })
    }

    return res.json({
      id: scan._id.toString(),
      foods: scan.foods || [],
      totalNutrition: scan.totalNutrition || {},
      totalMicronutrients: scan.totalMicronutrients || {},
      confidence: scan.confidence || 0,
      notes: scan.notes || [],
      imageReference: scan.imageReference || '',
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteScan(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid scan id.' })
    }

    const scan = await FoodScan.findOne({ _id: req.params.id, userId: req.user.id })
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found.' })
    }

    await FoodScan.deleteOne({ _id: scan._id })
    return res.json({ message: 'Scan deleted successfully.' })
  } catch (error) {
    next(error)
  }
}
