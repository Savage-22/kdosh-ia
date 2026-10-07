import cors from 'cors'
import express from 'express'

import { config } from './config/env.js'
import { registerModules } from './modules/index.js'
import { errorHandler, notFoundHandler } from './shared/http/errorHandler.js'

const app = express()

app.use(cors({ origin: config.frontendOrigin }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } })
})

registerModules(app)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
