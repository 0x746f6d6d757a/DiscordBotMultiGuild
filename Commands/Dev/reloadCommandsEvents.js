import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import config from '../../Configs/config.json' with { type: 'json' }
import { loadCommands } from '../../Utils/Handlers/commandHandler.js'
import { loadEvents } from '../../Utils/Handlers/eventHandler.js'
import { logger } from '../../Utils/Tools/customLogger.js'
import fs from 'fs'

export default { 
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads all commands and events (Dev only)'),
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     * @param {import('discord.js').Client} client
     */
    async execute(interaction, client) {
       if (interaction.user.id !== config.developerInfo.id) return interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral })
    
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        logger("INFO", `Reloading all commands. Requested by ${interaction.user.tag} (${interaction.user.id})`)
        await loadCommands(client)
        logger("INFO", `Reloaded all commands. Requested by ${interaction.user.tag} (${interaction.user.id})`)

        logger("INFO", `Reloading all events. Requested by ${interaction.user.tag} (${interaction.user.id})`)
        await loadEvents(client)
        logger("INFO", `Reloaded all events. Requested by ${interaction.user.tag} (${interaction.user.id})`)

        await interaction.editReply({ content: 'Successfully reloaded all commands and events.', flags: MessageFlags.Ephemeral })
    }
}