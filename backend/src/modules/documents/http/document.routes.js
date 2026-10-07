import { Router } from 'express'
import multer from 'multer'

import DocumentController from './document.Controller.js'

const router = Router()
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
})

router.get('/', DocumentController.list)
router.post('/', upload.single('file'), DocumentController.create)
router.delete('/:id', DocumentController.remove)
router.post('/ask', DocumentController.answerQuestion)

export default router
