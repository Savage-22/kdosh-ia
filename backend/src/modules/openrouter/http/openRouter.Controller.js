import OpenRouterService from '../application/openRouter.Service.js'

class OpenRouterController {
    static async listModels(req, res, next) {
        try {
            const models = await OpenRouterService.listModels()
            res.status(200).json({ success: true, data: models })
        } catch (error) {
            next(error)
        }
    }

    static async createChatCompletion(req, res, next) {
        try {
            const completion = await OpenRouterService.createChatCompletion(req.body)
            res.status(200).json({ success: true, data: completion })
        } catch (error) {
            next(error)
        }
    }
}

export default OpenRouterController
