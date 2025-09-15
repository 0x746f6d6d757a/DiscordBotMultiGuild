import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js'
import config from '../../Configs/config.json' with { type: 'json' }
import { executeQuery } from '../../Utils/SQL/databaseManager.js'
import { logger } from '../../Utils/Tools/customLogger.js'

export default {
    data: new SlashCommandBuilder()
        .setName('guild_change_settings')
        .setDescription('Change settings for the guild.'),
    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        if (!interaction.isCommand()) return

        const SettingsEmbed = new EmbedBuilder()
            .setTitle('Change Guild Settings')
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setDescription('Modify the settings for this guild using the dropdown menu below.')
            .setColor(0x5865F2)
            .setFooter({ text: config.developerInfo.username, iconURL: config.developerInfo.icon })
            .setTimestamp()

        // Fetch current settings from the database
        const guildId = interaction.guild.id;
        const queryGuildExists = 'SELECT * FROM guilds WHERE guildId = ?';
        var { rows } = await executeQuery(queryGuildExists, guildId);

        if (rows    .length === 0) {
            SettingsEmbed.setDescription('No settings found for this guild.\nPlease run the setup command first.');
            return interaction.reply({ embeds: [SettingsEmbed], flags: MessageFlags.Ephemeral });
        }

        const queryGuildConfig = 'SELECT * FROM guild_configs WHERE guildId = ?';
        var { rows } = await executeQuery(queryGuildConfig, guildId);

        if (rows.length === 0) {
            logger("INFO", `No settings found for guild ${interaction.guild.name} (${interaction.guild.id}).`);
            return interaction.reply({ content: 'No settings found for this guild.\nContact support for assistance.', flags: MessageFlags.Ephemeral });
        }

        logger("INFO", `Fetched settings for guild ${interaction.guild.name} (${interaction.guild.id})`);

        let parsedSettings = Object.fromEntries(rows.map(row => [row.configType, JSON.parse(row.configSettings)]));
        logger("INFO", `Parsed settings for guild ${interaction.guild.name} (${interaction.guild.id}).`);

        // Create the Select Menu with the type of the configs as options to edit
        const selectMenuOptions = new StringSelectMenuBuilder()

        for (const [key, value] of Object.entries(parsedSettings)) {

            selectMenuOptions.addOptions({
                label: camelCaseToTitle(key),
                description: `Edit the ${key} settings.`,
                value: key
            })

        }

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                selectMenuOptions.setCustomId('select_guild_setting')
                .setPlaceholder('Select a setting to edit...')
            )

        
        logger("INFO", `Prepared settings embed and select menu for guild ${interaction.guild.name} (${interaction.guild.id}).`);
        await interaction.reply({ embeds: [SettingsEmbed], components: [selectMenu] });

    }
}

function camelCaseToTitle(str) {
    return str.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());
}