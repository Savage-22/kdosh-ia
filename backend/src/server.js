import app from './app.js'
import { verifyDatabaseConnection } from './config/database.js'
import { config, validateEnvironment } from './config/env.js'

validateEnvironment()

const startServer = async () => {
    await verifyDatabaseConnection()

    app.listen(config.port, () => {
        console.log(`Backend disponible en http://localhost:${config.port}`)
    })
}

startServer().catch((error) => {
    console.error('No fue posible conectar con PostgreSQL', error)
    process.exit(1)
})
