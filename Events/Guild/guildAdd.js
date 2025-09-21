import { EmbedBuilder, Events, Guild, StringSelectMenuBuilder } from 'discord.js';
import { logger } from '../../Utils/Tools/customLogger.js'
import config from '../../Configs/config.json' with { type: 'json' }
import { executeQuery } from '../../Utils/SQL/databaseManager.js';

export default {
    name: Events.GuildCreate,
    /**
     * @param {Guild} guild
     */
    async execute(guild) {
        logger('INFO', `Bot has joined a new guild: ${guild.name} (${guild.id})`)
        const serverOwner = await guild.fetchOwner()

        const guildAddQuery = `INSERT INTO guilds (guildId, ownerId, isPaying) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ownerId = VALUES(ownerId), isPaying = VALUES(isPaying)`
        await executeQuery(guildAddQuery, guild.id, serverOwner.id, 0)
        logger('INFO', `Guild ${guild.name} (${guild.id}) added to the database.`)

        const dmMessage = `# Xylo

Thanks for choosing *Xylo*, a discord bot that i developed from the start alone.
To access all of Xylo's features you need to run the command \`/guild_setup\` inside your discord server.
After that command you will be able to use everything else, also \`/guild_change_settings\` to edit everything as you please!

If you want to recive my support contact me on \`0x746f6d6d757a\` or join my discord server: https://discord.gg/UdGMEYGCYw
There will be a website interface very soon, if you want to partecipate to this project and help me develope this bot reach out to me!

Thanks again for choosing me!`

        serverOwner.send({ content: dmMessage }).catch(err => {
            logger('ERROR', `Could not send DM to the owner of guild ${guild.name} (${guild.id}) - ${err}`)
        })

    }
}