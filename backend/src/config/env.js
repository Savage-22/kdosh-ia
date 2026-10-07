import 'dotenv/config'

const requiredEnvironmentVariables = ['OPENROUTER_API_KEY', 'DATABASE_URL']

export const validateEnvironment = () => {
    const missingVariables = requiredEnvironmentVariables.filter((name) => !process.env[name])

    if (missingVariables.length > 0) {
        throw new Error(`Faltan variables de entorno: ${missingVariables.join(', ')}`)
    }
}

export const config = {
    port: Number(process.env.PORT || 3001),
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterAppUrl: process.env.OPENROUTER_APP_URL || 'http://localhost:5173',
    openRouterAppName: process.env.OPENROUTER_APP_NAME || 'Kdosh IA Demo',
    databaseUrl: process.env.DATABASE_URL,
}
