// ticketSystemMessages.js
import { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js'
import config from '../../Configs/config.json' with { type: 'json' }
/**
 * 
 * @param {string} guildId 
 * @param {Object} ticketSystemConfig 
 */
function generateActionRow(guildId, ticketSystemConfig) {
    const enableButton = new ButtonBuilder()
        .setCustomId(ticketSystemConfig.enabled ? `${guildId}-ticketSystem-setDisable` : `${guildId}-ticketSystem-setEnable`)
        .setLabel(ticketSystemConfig.enabled ? 'Disable Ticket System' : 'Enable Ticket System')
        .setStyle(ButtonStyle.Secondary)
    
    const setGeneralCategoryButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-setGeneralCategory`)
        .setLabel('Set General Category')
        .setStyle(ButtonStyle.Secondary)

    const manageRolesButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-manageRoles`)
        .setLabel('Manage Roles in Ticket')
        .setStyle(ButtonStyle.Secondary)

    const manageUsersButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-manageUsers`)
        .setLabel('Manage Users in Ticket')
        .setStyle(ButtonStyle.Secondary)

    const setTicketLimitButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-setTicketLimit`)
        .setLabel('Set Ticket Limit')
        .setStyle(ButtonStyle.Secondary)

    const configureEmbedButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-configureEmbed`)
        .setLabel('Configure Embed Message')
        .setStyle(ButtonStyle.Secondary)

    const manageCategoriesButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-manageCategories`)
        .setLabel('Manage Ticket Categories')
        .setStyle(ButtonStyle.Secondary)

    const manageTypeButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-manageType`)
        .setLabel('Manage Ticket Type')
        .setStyle(ButtonStyle.Secondary)

    const manageCustomCategoriesButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-manageCustomCategories`)
        .setLabel('Manage Custom Categories')
        .setStyle(ButtonStyle.Secondary)

    const saveButton = new ButtonBuilder()
        .setCustomId(`${guildId}-save_settings`)
        .setLabel('Save Settings')
        .setStyle(ButtonStyle.Primary)

    const exitButton = new ButtonBuilder()
        .setCustomId(`${guildId}-exit_settings`)
        .setLabel('Return to Main Menu')
        .setStyle(ButtonStyle.Primary)

    const firstActionRow = new ActionRowBuilder().addComponents(enableButton, setGeneralCategoryButton, manageRolesButton, manageUsersButton, setTicketLimitButton)
    const secondActionRow = new ActionRowBuilder().addComponents(configureEmbedButton, manageCategoriesButton, manageTypeButton, manageCustomCategoriesButton)
    const thirdActionRow = new ActionRowBuilder().addComponents(saveButton, exitButton)

    return [firstActionRow, secondActionRow, thirdActionRow]

}

/**
 * @param {Object} ticketSystemConfig 
 */
function generateEmbed(ticketSystemConfig) {
    
    return new EmbedBuilder()
        .setTitle('Ticket System Settings')
        .setDescription('Modify the settings for the Ticket System using the buttons below.\n\nCurrent settings:')
        .setFields(
            { name: 'Ticket System Status:', value: ticketSystemConfig.enabled ? 'Enabled.' : 'Disabled.' },
            { name: 'General Category:', value: ticketSystemConfig.generalCategoryID ? `<#${ticketSystemConfig.generalCategoryID}> (${ticketSystemConfig.generalCategoryID})` : 'Not Set.' },
            { name: 'Roles in Ticket:', value: ticketSystemConfig.rolesInTicket && ticketSystemConfig.rolesInTicket.length > 0 ? ticketSystemConfig.rolesInTicket.map(roleId => `<@&${roleId}>`).join(', ') : 'No Roles Set.' },
            { name: 'Users in Ticket:', value: ticketSystemConfig.usersInTicket && ticketSystemConfig.usersInTicket.length > 0 ? ticketSystemConfig.usersInTicket.map(userId => `<@${userId}>`).join(', ') : 'No Users Set.' },
            { name: 'Ticket Limit:', value: ticketSystemConfig.ticketLimit ? ticketSystemConfig.ticketLimit.toString() : 'No Limit Set.' },
        )
        .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
        .setTimestamp();

}

export async function sendTicketSystemSettingsMessage(interaction, guildId, ticketSystemConfig, replyMessage = null) {
    const buttons = generateActionRow(guildId, ticketSystemConfig);
    const embed = generateEmbed(ticketSystemConfig);

    if (replyMessage) {
        await interaction.reply({ content: replyMessage, flags: MessageFlags.Ephemeral });
        const originalMessage = interaction.message || await interaction.fetchReply();
        if (originalMessage) await originalMessage.edit({ embeds: [embed], components: buttons });
        
    } else {
        await interaction.update({ embeds: [embed], components: buttons });
    }
}

async function generateMessageRoleComponent(guildId, rolesInTicket) {

    const embedInfo = new EmbedBuilder()
        .setTitle('Manage Roles in Tickets')
        .setDescription('Use the buttons below to add or remove roles that should have access to all tickets.')
        .setColor(0x0099ff)
        .setFooter({ text: 'Ticket System | Powered by Xylo', iconURL: config.developerInfo.icon })
        .setTimestamp()

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`${guildId}-ticketSystem-manageRoles`)
        .setPlaceholder(`Select an option or role.`)
        .addOptions([
            { label: `Add Role`, value: 'addRole' },
            { label: `Remove Role`, value: 'removeRole' },
            { label: `Clear All Roles`, value: 'clearRoles' }
        ])

    if (rolesInTicket && rolesInTicket.length > 0) rolesInTicket.forEach(roleId => { selectMenu.addOptions({ label: `Role ID: ${roleId}`, value: `${roleId}-manage` }) })

    const exitButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketRoleSystem-go_back`)
        .setLabel('Return to Main Menu')
        .setStyle(ButtonStyle.Primary)
    
    const actionRow = new ActionRowBuilder().addComponents(selectMenu)
    const buttonRow = new ActionRowBuilder().addComponents(exitButton)

    return { embeds: [embedInfo], components: [actionRow, buttonRow] }
}

export async function sendMessageRoleMessage(guildId, rolesInTicket, interaction, replyMessage = null) {
    const { embeds, components } = await generateMessageRoleComponent(guildId, rolesInTicket);

    if (replyMessage) {
        await interaction.reply({ content: replyMessage, flags: MessageFlags.Ephemeral });
        const originalMessage = interaction.message || await interaction.fetchReply();
        if (originalMessage) await originalMessage.edit({ embeds: [embed], components: buttons });
        
    } else {
        await interaction.update({ embeds: embeds, components: components });
    }

}