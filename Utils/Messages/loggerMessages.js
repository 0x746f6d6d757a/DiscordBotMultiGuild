import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js'
import config from '../../Configs/config.json' with { type: 'json' }

/**
 * Generate the action row for logger messages settings.
 * @param {string} guildId 
 * @param {Object} loggerSystemConfig 
 */
function generateActionRow(guildId, loggerSystemConfig) {

    const enableButton = new ButtonBuilder()
        .setCustomId(loggerSystemConfig.enabled ? `${guildId}-loggerSystem-setDisable` : `${guildId}-loggerSystem-setEnable`)
        .setLabel(loggerSystemConfig.enabled ? 'Disable Logging' : 'Enable Logging')
        .setStyle(ButtonStyle.Secondary)

    const setAdminRoleButton = new ButtonBuilder()
        .setCustomId(`${guildId}-loggerSystem-setAdminRole`)
        .setLabel('Set Admin Role')
        .setStyle(ButtonStyle.Secondary)

    const setCategoryButton = new ButtonBuilder()
        .setCustomId(`${guildId}-loggerSystem-setCategory`)
        .setLabel('Set Category')
        .setStyle(ButtonStyle.Secondary)

    const setLoggingLevelButton = new ButtonBuilder()
        .setCustomId(`${guildId}-loggerSystem-setLoggingLevel`)
        .setLabel('Set Logging Level')
        .setStyle(ButtonStyle.Secondary)

    const saveButton = new ButtonBuilder()
        .setCustomId(`${guildId}-save_settings`)
        .setLabel('Save Settings')
        .setStyle(ButtonStyle.Primary)

    const exitButton = new ButtonBuilder()
        .setCustomId(`${guildId}-exit_settings`)
        .setLabel('Return to Main Menu')
        .setStyle(ButtonStyle.Primary)

    const firstActionRow = new ActionRowBuilder().addComponents(enableButton, setAdminRoleButton, setCategoryButton, setLoggingLevelButton)
    const secondActionRow = new ActionRowBuilder().addComponents(saveButton, exitButton)

    return [firstActionRow, secondActionRow]
}

/**
 * Generate the embed for logger messages settings.
 * @param {Object} loggerSystemConfig 
 */
function generateEmbed(loggerSystemConfig) {
    return new EmbedBuilder()
        .setTitle('Logger System Settings')
        .setDescription('Modify the settings for the Logger System using the buttons below.\n\nCurrent settings:')
        .setFields(
            { name: 'Logging Status:', value: loggerSystemConfig.enabled ? 'Enabled.' : 'Disabled.' },
            { name: 'Admin Role:', value: loggerSystemConfig.adminRoleId ? `<@&${loggerSystemConfig.adminRoleId}> (${loggerSystemConfig.adminRoleId})` : 'Not Set.' },
            { name: 'Category:', value: loggerSystemConfig.categoryParentID ? `<#${loggerSystemConfig.categoryParentID}> (${loggerSystemConfig.categoryParentID})` : 'Not Set.' },
            { name: 'Logging Level:', value: `${loggerSystemConfig.loggingLevel}/3` }
        )
        .setColor(0x47346E)
        .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
        .setTimestamp();
}

/**
 * Send the message with logger system settings components.
 * @param {import('discord.js').Interaction} interaction 
 * @param {string} guildId 
 * @param {object} loggerSystemConfig 
 * @param {string} replyMessage 
 */
export default async function sendLoggerSystemSettingsComponents(interaction, guildId, loggerSystemConfig, replyMessage = null) {
    const buttons = generateActionRow(guildId, loggerSystemConfig);
    const embed = generateEmbed(loggerSystemConfig);

    if (replyMessage) {
        await interaction.reply({ content: replyMessage, flags: MessageFlags.Ephemeral });
        const originalMessage = interaction.message || await interaction.fetchReply();
        if (originalMessage) await originalMessage.edit({ embeds: [embed], components: buttons });
        
    } else {
        await interaction.update({ embeds: [embed], components: buttons });
    }

}