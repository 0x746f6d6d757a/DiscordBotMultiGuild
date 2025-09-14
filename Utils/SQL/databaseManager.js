import { createPool, createConnection } from 'mysql2/promise'
import dbConfig from '../../Configs/database.json' with { type: 'json' }
import { logger } from '../Tools/customLogger'

let databasePool = null
let lastReconnectAttempt = 0
const reconnectingInterval = 10000 // 10 seconds

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

export default async function getDatabasePool() {

    if(databasePool) return databasePool
    logger("DB", "Checking if database exists...")

    const tempConnection = await createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port
    })

    const [ databases ] = await tempConnection.query('SHOW DATABASES LIKE ?', [dbConfig.database])
    if (databases.length === 0) await tempConnection.query(`CREATE DATABASE \`${dbConfig.database}\``)
    await tempConnection.end()
    logger("DB", "Database exists or was created successfully.")

    databasePool = await createNewPool()
    logger("DB", "Created database connection pool.")
    return databasePool

}

export async function executeQuery(query, ...params) {

    if (!databasePool) databasePool = await getDatabasePool()

    try {
        const [ rows, fields ] = await databasePool.execute(query, params)
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

async function createNewPool() {

    const dbPool = createPool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    })

    databasePool.on('error', async ( error ) => {
        
        switch (error.code) {

            // Connection lost / network issues
            case 'PROTOCOL_CONNECTION_LOST':
                logger("DB_ERROR", "Database connection lost.")

                const currentTime = Date.now()
                if (currentTime - lastReconnectAttempt < reconnectingInterval) {
                    logger("DB_ERROR", "Reconnect attempt throttled, waiting...")
                    break
                }

                lastReconnectAttempt = currentTime
                logger("DB", `Attempting to reconnect in ${reconnectingInterval / 1000}s...`)
                await delay(reconnectingInterval)

                try {
                    
                    databasePool = null
                    await getDatabasePool()
                    logger("DB", "Reconnected to the database successfully.")
                } catch (reconnectError) {
                    logger("DB_ERROR", `Database reconnection failed: ${reconnectError.message}`)
                }
                break

            case 'ECONNREFUSED':
                logger("DB_ERROR", "Database connection refused (is the server running?).")
                break
            case 'ETIMEDOUT':
                logger("DB_ERROR", "Database connection attempt timed out.")
                break

            // Too many connections
            case 'ER_CON_COUNT_ERROR':
                logger("DB_ERROR", "Database has too many connections.")
                break

            // Authentication / permission issues
            case 'ER_ACCESS_DENIED_ERROR':
                logger("DB_ERROR", "Access denied: invalid username/password or insufficient privileges.")
                break

            // Missing database or table
            case 'ER_BAD_DB_ERROR':
                logger("DB_ERROR", "Database does not exist.")
                break
            case 'ER_NO_SUCH_TABLE':
                logger("DB_ERROR", "Table does not exist.")
                break

            // Query protocol / enqueue issues
            case 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR':
                logger("DB_ERROR", "Cannot enqueue query after fatal error on connection.")
                break
            case 'PROTOCOL_ENQUEUE_AFTER_QUIT':
                logger("DB_ERROR", "Cannot enqueue query after connection quit.")
                break
            case 'PROTOCOL_ENQUEUE_HANDSHAKE_TWICE':
                logger("DB_ERROR", "Handshake already in progress or completed.")
                break

            // Server gone / shutdown
            case 'PROTOCOL_CONNECTION_FAILED':
                logger("DB_ERROR", "Connection to database server failed.")
                break
            case 'SERVER_SHUTDOWN':
                logger("DB_ERROR", "Database server shutdown detected.")
                break

            // General / unknown
            default:
                logger("DB_ERROR", `Unhandled database error: code=${error.code}, errno=${error.errno}, message=${error.message}`)
                break
        }

    })

    return dbPool

}