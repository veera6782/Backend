import cors from 'cors'
import dns from 'dns'
import express from 'express'
import { connectDatabase } from './config/database.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import userRoutes from './routes/userRoutes.js'

dns.setServers(['8.8.8.8', '8.8.4.4'])
const app = express()
const port = Number(process.env.PORT) || 5000
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: frontendOrigin }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})
app.use('/api/users', userRoutes)
app.use(notFound)
app.use(errorHandler)

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`NutriOwl backend listening on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('Unable to start backend:', error.message)
    process.exitCode = 1
  })
