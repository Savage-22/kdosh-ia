import { Router } from 'express'

import OpenRouterController from './openRouter.Controller.js'

const router = Router()

router.get('/models', OpenRouterController.listModels)
router.post('/chat', OpenRouterController.createChatCompletion)

export default router
