import { Router } from 'express'

import UsageController from './usage.Controller.js'

const router = Router()

router.get('/summary', UsageController.getSummary)

export default router
