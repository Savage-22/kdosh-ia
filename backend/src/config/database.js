import pg from 'pg'

import { config } from './env.js'

const { Pool } = pg

export const pool = new Pool({ connectionString: config.databaseUrl })

export const verifyDatabaseConnection = async () => {
    await pool.query('SELECT 1')
}
