import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js'
import { logger } from '../../Utils/Tools/customLogger.js'
import { loadGuildSettings } from '../../Utils/SQL/guildSettingsManager.js'
import sendMainMenuMessage from '../../Utils/Messages/mainMenuChangeMessage.js'

export default {
    data: new SlashCommandBuilder()
        .setName('guild_change_settings')
        .setDescription('Change settings for the guild.'),
    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        if (!interaction.isCommand()) return

        try {
            const guildId = interaction.guild.id
            const guildSettings = await loadGuildSettings(guildId)

            if (!guildSettings) {
                logger("INFO", `No settings found for guild ${interaction.guild.name} (${interaction.guild.id}).`)
                return interaction.reply({ content: 'No settings found for this guild.\nPlease run the setup command first.', flags: MessageFlags.Ephemeral })
            }

            logger("INFO", `Fetched settings for guild ${interaction.guild.name} (${interaction.guild.id})`)

            // Send the main menu
            await sendMainMenuMessage(interaction, guildSettings)
            logger("INFO", `Sent settings menu for guild ${interaction.guild.name} (${interaction.guild.id})`)

        } catch (error) {
            logger("ERROR", `Failed to load guild settings for ${interaction.guild.name} (${interaction.guild.id}): ${error.stack}`)
            return interaction.reply({ content: 'An error occurred while loading guild settings. Please try again later.', flags: MessageFlags.Ephemeral })
        }
    }
}



