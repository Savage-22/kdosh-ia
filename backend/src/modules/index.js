import documentRoutes from './documents/http/document.routes.js'
import openRouterRoutes from './openrouter/http/openRouter.routes.js'
import usageRoutes from './usage/http/usage.routes.js'

export const registerModules = (app) => {
    app.use('/api/documents', documentRoutes)
    app.use('/api/openrouter', openRouterRoutes)
    app.use('/api/usage', usageRoutes)
}
