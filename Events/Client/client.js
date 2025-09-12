import { Events, Client, ActivityType } from 'discord.js'
import { loadCommands } from '../../Utils/Handlers/commandHandler.js'
import { logger } from '../../Utils/Tools/customLogger.js'

export default {
    name: Events.ClientReady,
    once: true,
    /**
     * @param {Client} client 
    */
    async execute(client) {
        await loadCommands(client)
        logger('INFO', `Logged in as ${client.user.tag}!`)
        client.user.setActivity({ name: `Watching over ${client.guilds.cache.size} servers`, type: ActivityType.Watching })
    }
}