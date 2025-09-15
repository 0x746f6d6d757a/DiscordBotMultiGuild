import { Events, Client, ActivityType } from 'discord.js'
import { loadCommands } from '../../Utils/Handlers/commandHandler.js'
import { logger } from '../../Utils/Tools/customLogger.js'
import fs from 'fs/promises'
import path from 'path'

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

        // Getting developer informations
        const developer = await client.users.fetch('657881377559281666')
        const developerIcon = developer.displayAvatarURL()
        const developerUsername = developer.username

        const developerInfo = {
            id: developer.id,
            tag: developer.tag,
            icon: developerIcon,
            username: developerUsername
        }

        // Write the developer information to the config file
        const configPath = path.join(process.cwd(), 'Configs', 'config.json')
        const configData = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(configData)
        config.developerInfo = developerInfo
        await fs.writeFile(configPath, JSON.stringify(config, null, 4))
        logger("INFO", `Updated developer information in config.json`)

    }
}