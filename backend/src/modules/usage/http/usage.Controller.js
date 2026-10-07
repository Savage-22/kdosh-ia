import UsageModel from '../infrastructure/usage.Model.js'

class UsageController {
    static async getSummary(req, res, next) {
        try {
            const summary = await UsageModel.findSummary()
            res.status(200).json({ success: true, data: summary })
        } catch (error) {
            next(error)
        }
    }
}

export default UsageController
