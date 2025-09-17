import { executeQuery } from './databaseManager.js'
import { logger } from '../Tools/customLogger.js'

/**
 * Save guild settings to the database
 * @param {string} guildId 
 * @param {Object} guildSettings 
 */
export async function saveGuildSettings(guildId, guildSettings) {
    try {
        for (const [systemName, systemConfig] of Object.entries(guildSettings)) {
            const query = `INSERT INTO guild_configs (guildId, configType, configSettings) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE configSettings = ?`
            await executeQuery(query, guildId, systemName, JSON.stringify(systemConfig), JSON.stringify(systemConfig))
        }
        logger('INFO', `Guild settings saved for guild ${guildId}`)
    } catch (error) {
        logger('ERROR', `Failed to save guild settings for guild ${guildId}: ${error.stack}`)
        throw error
    }
}

/**
 * Load guild settings from the database
 * @param {string} guildId 
 * @returns {Object} guildSettings
 */
export async function loadGuildSettings(guildId) {
    try {
        const query = 'SELECT configType, configSettings FROM guild_configs WHERE guildId = ?'
        const { rows } = await executeQuery(query, guildId)
        
        const settings = {}
        for (const row of rows) { settings[row.configType] = JSON.parse(row.configSettings) }
        
        return settings
    } catch (error) {
        logger('ERROR', `Failed to load guild settings for guild ${guildId}: ${error.stack}`)
        throw error
    }
}