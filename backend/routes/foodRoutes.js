import multer from 'multer'
import { Router } from 'express'
import { analyzeFood, deleteScan, getRecentScans, getScanById } from '../controllers/foodController.js'
import { requireAuth } from '../middleware/auth.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

const router = Router()

router.post('/analyze', requireAuth, upload.single('image'), analyzeFood)
router.get('/recent', requireAuth, getRecentScans)
router.get('/scans/:id', requireAuth, getScanById)
router.delete('/scans/:id', requireAuth, deleteScan)

export default router
