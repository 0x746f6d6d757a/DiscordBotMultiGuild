import { createPool, createConnection } from 'mysql2/promise'
import dbConfig from '../../Configs/database.json' with { type: 'json' }
import { logger } from '../Tools/customLogger'

let databasePool = null

export default async function getDatabasePool() {

    if(databasePool) return databasePool
    logger("DB", "Establishing new database connection pool...")

    const tempConnection = await createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port
    })

    const [ databases ] = await tempConnection.query('SHOW DATABASES LIKE ?', [dbConfig.database])
    if (databases.length === 0) await tempConnection.query(`CREATE DATABASE \`${dbConfig.database}\``)
    await tempConnection.end()


    databasePool = createPool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    })

    logger("DB", "Database connection pool established.")
    return databasePool

}

export async function executeQuery(query, ...params) {

    const databaseConnection = await getDatabasePool()

    try {
        const [ rows, fields ] = await databaseConnection.execute(query, params)
        logger("DB", `Executed query: ${query} with ${params.length} params.`)
        return { rows, fields }
    } catch (error) {
        logger("DB_ERROR", `Database query error: ${error.message}`)
        throw error
    }

}

export async function closeDatabasePool() {
    if (databasePool) {
        await databasePool.end()
        logger("DB", "Database connection pool closed.")
        databasePool = null
    }
}