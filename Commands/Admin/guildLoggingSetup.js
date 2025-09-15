import setupLoggingSystem from '../../Utils/Tools/logginSystemSetup.js';
import config from '../../Configs/guilds.json' with { type: 'json' };
import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../Utils/Tools/customLogger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('guild_logging_setup')
        .setDescription('Sets up the logging system for the guild.'),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        if(!interaction.isCommand()) return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const result = await setupLoggingSystem(config, interaction);

        if(result.isLogging === false) {
            logger("ERROR", `Logging setup failed or is disabled in guild ${interaction.guild.name} (${interaction.guild.id}) - Reason: ${result.message}`);
            return interaction.editReply({ content: result.message });
        } else {
            logger("INFO", `Logging setup completed in guild ${interaction.guild.name} (${interaction.guild.id})`);
            return interaction.editReply({ content: `Logging system setup completed successfully!` });
        }

    }
};