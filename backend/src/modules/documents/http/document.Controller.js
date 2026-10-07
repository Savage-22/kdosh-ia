import DocumentService from '../application/document.Service.js'
import RagService from '../application/rag.Service.js'

class DocumentController {
    static async create(req, res, next) {
        try {
            const document = await DocumentService.createFromPdf(req.file)
            res.status(201).json({ success: true, data: document })
        } catch (error) {
            next(error)
        }
    }

    static list(req, res, next) {
        try {
            res.status(200).json({ success: true, data: DocumentService.list() })
        } catch (error) {
            next(error)
        }
    }

    static remove(req, res, next) {
        try {
            DocumentService.remove(req.params.id)
            res.status(200).json({ success: true, message: 'Documento eliminado' })
        } catch (error) {
            next(error)
        }
    }

    static async answerQuestion(req, res, next) {
        try {
            const answer = await RagService.answer(req.body)
            res.status(200).json({ success: true, data: answer })
        } catch (error) {
            next(error)
        }
    }
}

export default DocumentController
