import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js"; 

export default {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Will send the ticket creation message to the specified channel.'),
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {

        const ticketSettingsQuery = `SELECT configSettings FROM guild_configs WHERE guildId = ? AND configType = 'ticketSystem'`;
        const { rows } = await executeQuery(ticketSettingsQuery, interaction.guild.id);

        if (rows.length === 0) return interaction.reply({ content: 'Ticket system is not set up for this guild. Please run the setup command first.', flags: MessageFlags.Ephemeral });

        const ticketSettings = JSON.parse(rows[0].configSettings);
        if (!ticketSettings.enabled) return interaction.reply({ content: 'Ticket system is currently disabled. Please enable it in the settings first.', flags: MessageFlags.Ephemeral });
        
        
            

        
    }
};