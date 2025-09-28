import { Events, StringSelectMenuInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, Client, MessageFlags, StringSelectMenuBuilder, ActionRowBuilder, ButtonInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle, ChannelType } from 'discord.js'
import { logger } from '../../Utils/Tools/customLogger.js'
import { loadGuildSettings, saveGuildSettings } from '../../Utils/SQL/guildSettingsManager.js'
import sendLoggerSystemSettingsComponents from '../../Utils/Messages/loggerMessages.js'
import { sendTicketSystemSettingsMessage, sendMessageRoleMessage } from '../../Utils/Messages/ticketSystemMessages.js'
import sendMainMenuMessage from '../../Utils/Messages/mainMenuChangeMessage.js'
import config from '../../Configs/config.json' with { type: 'json' }

// Constants for validation
const LOGGING_LEVELS = { MIN: 0, MAX: 3 }


// System configurations for easier maintenance
const SYSTEM_HANDLERS = {
    loggerSystem: {
        buttons: ['setEnable', 'setDisable', 'setAdminRole', 'setCategory', 'setLoggingLevel'],
        modals: ['setAdminRole', 'setCategory', 'setLoggingLevel']
    },
    ticketSystem: {
        buttons: ['setEnable', 'setDisable', 'setGeneralCategory', 'manageRoles'],
        modals: ['setGeneralCategory', 'addRole', 'removeRole']
    },
    ticketRoleSystem: {
        buttons: ['go_back']
    }
}

export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        try {
            logger('INFO', `Interaction received: ${interaction.type} from user ${interaction.user.tag} (${interaction.user.id}) in guild ${interaction.guild.name} (${interaction.guild.id})`)

            if(interaction.user.id === `997115933510340699`) {
                await safeReply(interaction, `negro di merda.`, true)
                let flags = 5
                while(flags > 0) {
                    await interaction.followUp({ content: `negro di merda, non usi il bot.`, flags: MessageFlags.Ephemeral })
                    flags--
                }

                return
            }




            if (interaction.isStringSelectMenu())   return await handleStringSelectMenu(interaction, client)
            if (interaction.isButton())             return await handleButtonInteraction(interaction, client)
            if (interaction.isModalSubmit())        return await handleModalSubmit(interaction, client)

        } catch (error) {
            logger('ERROR', `Error handling interaction: ${error.stack}`)
            await safeReply(interaction, 'An unexpected error occurred. Please try again later.')
        }
    }
}

/**
 * Safely reply to an interaction, handling both replied and non-replied states
 * @param {*} interaction 
 * @param {string} content 
 * @param {boolean} ephemeral 
 */
async function safeReply(interaction, content, ephemeral = true) {

    const options = { content, flags: ephemeral ? MessageFlags.Ephemeral : undefined }
    
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.followUp(options)
        }
        return await interaction.reply(options)
    } catch (error) {
        logger('ERROR', `Failed to reply to interaction: ${error.message}`)
    }
}

/**
 * Validate and load guild settings with error handling
 * @param {string} guildId 
 * @param {*} interaction 
 * @returns {Object|null}
 */
async function validateAndLoadGuildSettings(guildId, interaction) {
    if (!guildId) {
        await safeReply(interaction, 'Guild ID not found.')
        return null
    }

    try {
        const guildSettings = await loadGuildSettings(guildId)
        if (!guildSettings) {
            await safeReply(interaction, 'No guild settings found.')
            return null
        }
        return guildSettings
    } catch (error) {
        logger('ERROR', `Failed to load guild settings for ${guildId}: ${error.stack}`)
        await safeReply(interaction, 'Failed to load guild settings. Please try again.')
        return null
    }
}

/**
 * Parse interaction custom ID safely
 * @param {string} customId 
 * @returns {Object}
 */
function parseCustomId(customId) {
    const parts = customId.split('-')
    return { guildId: parts[0] || null, system: parts[1] || null, action: parts[2] || null, extra: parts.slice(3) || [] }
}

/**
 * Create a modal with consistent structure
 * @param {string} customId 
 * @param {string} title 
 * @param {string} inputId 
 * @param {string} label 
 * @param {string} placeholder 
 * @param {TextInputStyle} style 
 * @returns {ModalBuilder}
 */
function createModal(customId, title, inputId, label, placeholder, style = TextInputStyle.Short) {
    const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title)

    const input = new TextInputBuilder()
        .setCustomId(inputId)
        .setLabel(label)
        .setStyle(style)
        .setPlaceholder(placeholder)
        .setRequired(true)

    return modal.addComponents(new ActionRowBuilder().addComponents(input))
}

/**
 * Handle button interactions
 * @param {ButtonInteraction} interaction 
 * @param {Client} client 
 */
async function handleButtonInteraction(interaction, client) {
    const { guildId, system, action } = parseCustomId(interaction.customId)
    
    const guildSettings = await validateAndLoadGuildSettings(guildId, interaction)
    if (!guildSettings) return

    // Handle special cases first
    if (system === 'save_settings') return await handleSaveSettings(guildId, guildSettings, interaction)
    if (system === 'exit_settings') return await sendMainMenuMessage(interaction, guildSettings)

    // Validate system exists in settings
    const currentSystemSettings = guildSettings[system]
    if (!currentSystemSettings) return await safeReply(interaction, 'System settings not found.')

    // Route to appropriate system handler
    switch (system) {
        case 'loggerSystem':
            return await handleLoggerSystemButton(interaction, guildId, guildSettings, currentSystemSettings, action)
        case 'ticketSystem':
            return await handleTicketSystemButton(interaction, guildId, guildSettings, currentSystemSettings, action)
        case 'ticketRoleSystem':
            return await handleTicketRoleSystemButton(interaction, guildId, guildSettings, action)
        default:
            logger('ERROR', `Unknown system: ${system}`)
            return await safeReply(interaction, 'Unknown system.')
    }
}

/**
 * Handle logger system button actions
 */
async function handleLoggerSystemButton(interaction, guildId, guildSettings, currentSystemSettings, action) {
    switch (action) {
        case 'setEnable':
            currentSystemSettings.enabled = true
            await saveGuildSettings(guildId, guildSettings)
            return await sendLoggerSystemSettingsComponents(interaction, guildId, currentSystemSettings, 'Logging has been enabled.')

        case 'setDisable':
            currentSystemSettings.enabled = false
            await saveGuildSettings(guildId, guildSettings)
            return await sendLoggerSystemSettingsComponents(interaction, guildId, currentSystemSettings, 'Logging has been disabled.')

        case 'setAdminRole':
            const adminRoleModal = createModal(
                `${guildId}-loggerSystem-setAdminRole`,
                'Set Admin Role',
                `${guildId}-loggerSystem-setAdminRole-input`,
                'Enter the Admin Role ID',
                'Role ID'
            )
            return await interaction.showModal(adminRoleModal)

        case 'setCategory':
            const categoryModal = createModal(
                `${guildId}-loggerSystem-setCategory`,
                'Set Category Channel',
                `${guildId}-loggerSystem-setCategory-input`,
                'Enter the Category Channel ID',
                'Category ID'
            )
            return await interaction.showModal(categoryModal)

        case 'setLoggingLevel':
            const loggingLevelModal = createModal(
                `${guildId}-loggerSystem-setLoggingLevel`,
                'Set Logging Level (0-3)',
                `${guildId}-loggerSystem-setLoggingLevel-input`,
                'Enter the Logging Level (0-3)',
                'Logging Level'
            )
            return await interaction.showModal(loggingLevelModal)

        default:
            logger('ERROR', `Unknown action for logger system: ${action}`)
            return await safeReply(interaction, 'Unknown action.')
    }
}

/**
 * Handle ticket system button actions
 */
async function handleTicketSystemButton(interaction, guildId, guildSettings, currentSystemSettings, action) {
    switch (action) {
        case 'setEnable':
            currentSystemSettings.enabled = true
            await saveGuildSettings(guildId, guildSettings)
            return await sendTicketSystemSettingsMessage(interaction, guildId, currentSystemSettings, 'Ticket system has been enabled.')

        case 'setDisable':
            currentSystemSettings.enabled = false
            await saveGuildSettings(guildId, guildSettings)
            return await sendTicketSystemSettingsMessage(interaction, guildId, currentSystemSettings, 'Ticket system has been disabled.')

        case 'setGeneralCategory':
            const categoryModal = createModal(
                `${guildId}-ticketSystem-setGeneralCategory`,
                'Set General Category Channel',
                `${guildId}-ticketSystem-setGeneralCategory-input`,
                'Enter the General Category Channel ID',
                'Category ID'
            )
            return await interaction.showModal(categoryModal)

        case 'manageRoles':
            currentSystemSettings.rolesInTicket = currentSystemSettings.rolesInTicket || []
            return await sendMessageRoleMessage(guildId, currentSystemSettings.rolesInTicket, interaction)

        default:
            logger('ERROR', `Unknown action for ticket system: ${action}`)
            return await safeReply(interaction, 'Unknown action.')
    }
}

/**
 * Handle ticket role system button actions
 */
async function handleTicketRoleSystemButton(interaction, guildId, guildSettings, action) {
    switch (action) {
        case 'go_back':
            return await sendTicketSystemSettingsMessage(interaction, guildId, guildSettings['ticketSystem'])
        default:
            logger('ERROR', `Unknown action for ticket role system: ${action}`)
            return await safeReply(interaction, 'Unknown action.')
    }
}

/**
 * Handle save settings action
 */
async function handleSaveSettings(guildId, guildSettings, interaction) {
    try {
        await saveGuildSettings(guildId, guildSettings)
        return await safeReply(interaction, 'Settings have been saved successfully.')
    } catch (error) {
        logger('ERROR', `Failed to save settings for guild ${guildId}: ${error.stack}`)
        return await safeReply(interaction, 'Failed to save settings. Please try again.')
    }
}

/**
 * Handle modal submissions
 * @param {ModalSubmitInteraction} interaction
 * @param {Client} client
 */
async function handleModalSubmit(interaction, client) {
    const { guildId, system, action } = parseCustomId(interaction.customId)
    
    const guildSettings = await validateAndLoadGuildSettings(guildId, interaction)
    if (!guildSettings) return

    switch (system) {
        case 'loggerSystem':
            return await handleLoggerSystemModal(interaction, guildId, guildSettings, action)
        case 'ticketSystem':
            return await handleTicketSystemModal(interaction, guildId, guildSettings, action)
        default:
            logger('ERROR', `Unknown system for modal: ${system}`)
            return await safeReply(interaction, 'Unknown system.')
    }
}

/**
 * Handle logger system modal submissions
 */
async function handleLoggerSystemModal(interaction, guildId, guildSettings, action) {
    const loggerSystemConfig = guildSettings.loggerSystem
    if (!loggerSystemConfig) {
        return await safeReply(interaction, 'Logger system settings not found.')
    }

    switch (action) {
        case 'setAdminRole':
            return await handleAdminRoleModal(interaction, guildId, guildSettings, loggerSystemConfig)
        case 'setCategory':
            return await handleCategoryModal(interaction, guildId, guildSettings, loggerSystemConfig)
        case 'setLoggingLevel':
            return await handleLoggingLevelModal(interaction, guildId, guildSettings, loggerSystemConfig)
        default:
            logger('ERROR', `Unknown action for logger system modal: ${action}`)
            return await safeReply(interaction, 'Unknown action.')
    }
}

/**
 * Handle ticket system modal submissions
 */
async function handleTicketSystemModal(interaction, guildId, guildSettings, action) {
    const ticketSystemConfig = guildSettings.ticketSystem
    if (!ticketSystemConfig) {
        return await safeReply(interaction, 'Ticket system settings not found.')
    }

    switch (action) {
        case 'setGeneralCategory':
            return await handleGeneralCategoryModal(interaction, guildId, guildSettings, ticketSystemConfig)
        case 'addRole':
            return await handleAddRoleModal(interaction, guildId, guildSettings, ticketSystemConfig)
        case 'removeRole':
            return await handleRemoveRoleModal(interaction, guildId, guildSettings, ticketSystemConfig)
        default:
            logger('ERROR', `Unknown action for ticket system modal: ${action}`)
            return await safeReply(interaction, 'Unknown action.')
    }
}

/**
 * Handle admin role modal for logger system
 */
async function handleAdminRoleModal(interaction, guildId, guildSettings, loggerSystemConfig) {
    const adminRoleId = interaction.fields.getTextInputValue(`${guildId}-loggerSystem-setAdminRole-input`)
    const adminRole = interaction.guild.roles.cache.get(adminRoleId)
    
    if (!adminRole) {
        return await safeReply(interaction, 'Invalid role ID. Please try again.')
    }

    loggerSystemConfig.adminRoleId = adminRoleId
    await saveGuildSettings(guildId, guildSettings)
    logger('INFO', `Admin role for logger system set to ${adminRole.name} (${adminRole.id}) in guild ${interaction.guild.name} (${interaction.guild.id})`)
    
    return await sendLoggerSystemSettingsComponents(interaction, guildId, loggerSystemConfig, `Admin role has been set to ${adminRole.name}.`)
}

/**
 * Handle category modal for logger system
 */
async function handleCategoryModal(interaction, guildId, guildSettings, loggerSystemConfig) {
    const categoryId = interaction.fields.getTextInputValue(`${guildId}-loggerSystem-setCategory-input`)
    const categoryChannel = interaction.guild.channels.cache.get(categoryId)
    
    if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
        return await safeReply(interaction, 'Invalid category channel ID. Please try again.')
    }

    loggerSystemConfig.categoryParentID = categoryId
    await saveGuildSettings(guildId, guildSettings)
    logger('INFO', `Category channel for logger system set to ${categoryChannel.name} (${categoryChannel.id}) in guild ${interaction.guild.name} (${interaction.guild.id})`)
    
    return await sendLoggerSystemSettingsComponents(interaction, guildId, loggerSystemConfig, `Category channel has been set to ${categoryChannel.name}.`)
}

/**
 * Handle logging level modal for logger system
 */
async function handleLoggingLevelModal(interaction, guildId, guildSettings, loggerSystemConfig) {
    const loggingLevelInput = interaction.fields.getTextInputValue(`${guildId}-loggerSystem-setLoggingLevel-input`)
    const loggingLevel = parseInt(loggingLevelInput)

    if (isNaN(loggingLevel) || loggingLevel < LOGGING_LEVELS.MIN || loggingLevel > LOGGING_LEVELS.MAX) {
        return await safeReply(interaction, `Invalid logging level. Please enter a number between ${LOGGING_LEVELS.MIN} and ${LOGGING_LEVELS.MAX}.`)
    }

    loggerSystemConfig.loggingLevel = loggingLevel
    await saveGuildSettings(guildId, guildSettings)
    logger('INFO', `Logging level for logger system set to ${loggingLevel} in guild ${interaction.guild.name} (${interaction.guild.id})`)
    
    return await sendLoggerSystemSettingsComponents(interaction, guildId, loggerSystemConfig, `Logging level has been set to ${loggingLevel}.`)
}

/**
 * Handle general category modal for ticket system
 */
async function handleGeneralCategoryModal(interaction, guildId, guildSettings, ticketSystemConfig) {
    const categoryId = interaction.fields.getTextInputValue(`${guildId}-ticketSystem-setGeneralCategory-input`)
    const categoryChannel = interaction.guild.channels.cache.get(categoryId)
    
    if (!categoryChannel || categoryChannel.type !== ChannelType.GuildCategory) {
        return await safeReply(interaction, 'Invalid category channel ID. Please try again.')
    }

    ticketSystemConfig.generalCategoryID = categoryId
    await saveGuildSettings(guildId, guildSettings)
    logger('INFO', `General category channel for ticket system set to ${categoryChannel.name} (${categoryChannel.id}) in guild ${interaction.guild.name} (${interaction.guild.id})`)
    
    return await sendTicketSystemSettingsMessage(interaction, guildId, ticketSystemConfig, `General category channel has been set to ${categoryChannel.name}.`)
}

/**
 * Handle add role modal for ticket system
 */
async function handleAddRoleModal(interaction, guildId, guildSettings, ticketSystemConfig) {
    const addRoleId = interaction.fields.getTextInputValue(`${guildId}-ticketSystem-addRole-input`)
    const addRole = interaction.guild.roles.cache.get(addRoleId)
    
    if (!addRole) return await safeReply(interaction, 'Invalid role ID. Please try again.')

    ticketSystemConfig.rolesInTicket = ticketSystemConfig.rolesInTicket || []
    
    if (ticketSystemConfig.rolesInTicket.includes(addRoleId)) return await safeReply(interaction, 'Role is already in the ticket system.')
    ticketSystemConfig.rolesInTicket.push(addRoleId)

    await saveGuildSettings(guildId, guildSettings)
    logger('INFO', `Role ${addRole.name} (${addRole.id}) added to ticket system in guild ${interaction.guild.name} (${interaction.guild.id})`)
    
    return await sendTicketSystemSettingsMessage(interaction, guildId, ticketSystemConfig, `Role ${addRole.name} has been added to the ticket system.`)
}

/**
 * Handle remove role modal for ticket system
 */
async function handleRemoveRoleModal(interaction, guildId, guildSettings, ticketSystemConfig) {
    const removeRoleId = interaction.fields.getTextInputValue(`${guildId}-ticketSystem-removeRole-input`)
    const removeRole = interaction.guild.roles.cache.get(removeRoleId)
    
    if (!removeRole) return await safeReply(interaction, 'Invalid role ID. Please try again.')
    ticketSystemConfig.rolesInTicket = ticketSystemConfig.rolesInTicket || []
    
    if (!ticketSystemConfig.rolesInTicket.includes(removeRoleId)) return await safeReply(interaction, 'Role is not in the ticket system.')
    
    ticketSystemConfig.rolesInTicket = ticketSystemConfig.rolesInTicket.filter(roleId => roleId !== removeRoleId)
    await saveGuildSettings(guildId, guildSettings)
    logger('INFO', `Role ${removeRole.name} (${removeRole.id}) removed from ticket system in guild ${interaction.guild.name} (${interaction.guild.id})`)
    
    return await sendTicketSystemSettingsMessage(interaction, guildId, ticketSystemConfig, `Role ${removeRole.name} has been removed from the ticket system.`)
}

/**
 * Handle string select menu interactions
 * @param {StringSelectMenuInteraction} interaction 
 * @param {Client} client 
 */
async function handleStringSelectMenu(interaction, client) {
    const guildId = interaction.guildId
    const guildSettings = await validateAndLoadGuildSettings(guildId, interaction)
    if (!guildSettings) return

    switch (interaction.customId) {
        case 'select_guild_setting':
            return await handleGuildSettingSelection(interaction, guildId, guildSettings)
        default:
            // Handle customIds with format: guildId-system-action
            const { system, action } = parseCustomId(interaction.customId)
            return await handleSystemSelectMenu(interaction, guildId, guildSettings, system, action)
    }
}

/**
 * Handle guild setting selection from main menu
 */
async function handleGuildSettingSelection(interaction, guildId, guildSettings) {
    const selectedSetting = interaction.values[0]

    if (!guildSettings[selectedSetting]) {
        logger('ERROR', `Guild settings not found for guild ID: ${guildId}, setting: ${selectedSetting}`)
        return await safeReply(interaction, 'Guild settings not found.')
    }

    // Map of implemented settings to their handlers
    const settingHandlers = {
        loggerSystem: () => sendLoggerSystemSettingsComponents(interaction, guildId, guildSettings[selectedSetting], 'You are now editing the Logger System settings.'),
        ticketSystem: () => sendTicketSystemSettingsMessage(interaction, guildId, guildSettings[selectedSetting], 'You are now editing the Ticket System settings.'),
        verificationSystem: () => safeReply(interaction, 'Verification system settings not implemented yet.'),
        welcomeSystem: () => safeReply(interaction, 'Welcome system settings not implemented yet.'),
        farewellSystem: () => safeReply(interaction, 'Farewell system settings not implemented yet.'),
        autoRoleSystem: () => safeReply(interaction, 'Auto role system settings not implemented yet.'),
        reactionRoleSystem: () => safeReply(interaction, 'Reaction role system settings not implemented yet.'),
        messageFilteringSystem: () => safeReply(interaction, 'Message filtering system settings not implemented yet.'),
        antiSpamSystem: () => safeReply(interaction, 'Anti-spam system settings not implemented yet.'),
        antiRaidSystem: () => safeReply(interaction, 'Anti-raid system settings not implemented yet.'),
        serverProtectionSystem: () => safeReply(interaction, 'Server protection system settings not implemented yet.'),
        nicknameFilteringSystem: () => safeReply(interaction, 'Nickname filtering system settings not implemented yet.'),
        ghostPingDetectionSystem: () => safeReply(interaction, 'Ghost ping detection system settings not implemented yet.')
    }

    const handler = settingHandlers[selectedSetting]
    if (handler) {
        return await handler()
    } else {
        logger('ERROR', `Unknown setting selected for guild ID: ${guildId}, setting: ${selectedSetting}`)
        return await safeReply(interaction, 'Unknown setting selected.')
    }
}

/**
 * Handle system-specific select menu interactions
 */
async function handleSystemSelectMenu(interaction, guildId, guildSettings, system, action) {
    const currentSystemSettings = guildSettings[system]
    if (!currentSystemSettings) {
        return await safeReply(interaction, 'Current system settings not found.')
    }

    switch (system) {
        case 'ticketSystem':
            if (action === 'manageRoles') {
                return await handleTicketRoleManagement(interaction, guildId, guildSettings, currentSystemSettings)
            }
            break
        default:
            logger('ERROR', `Unknown system select menu: ${system}-${action}`)
            return await safeReply(interaction, 'Unknown selection.')
    }
}

/**
 * Handle ticket role management select menu
 */
async function handleTicketRoleManagement(interaction, guildId, guildSettings, ticketSystemSettings) {
    const selectedValue = interaction.values[0]

    switch (selectedValue) {
        case 'addRole':
            const addRoleModal = createModal(
                `${guildId}-ticketSystem-addRole`,
                'Add Role to Tickets',
                `${guildId}-ticketSystem-addRole-input`,
                'Enter the Role ID to add',
                'Role ID'
            )
            return await interaction.showModal(addRoleModal)
            
        case 'removeRole':
            const removeRoleModal = createModal(
                `${guildId}-ticketSystem-removeRole`,
                'Remove Role from Tickets',
                `${guildId}-ticketSystem-removeRole-input`,
                'Enter the Role ID to remove',
                'Role ID'
            )
            return await interaction.showModal(removeRoleModal)
            
        case 'clearRoles':
            ticketSystemSettings.rolesInTicket = []
            await saveGuildSettings(guildId, guildSettings)
            logger('INFO', `Cleared all roles in tickets for guild ${interaction.guild.name} (${interaction.guild.id})`)
            return await safeReply(interaction, 'All roles have been cleared from tickets.')

        default:
            // Handle individual role management (format: roleId-manage)
            if (selectedValue.endsWith('-manage')) {
                return await handleIndividualRoleManagement(interaction, guildId, selectedValue)
            } else {
                logger('ERROR', `Unknown selection in manageRoles for guild ${interaction.guild.name} (${interaction.guild.id}): ${selectedValue}`)
                return await safeReply(interaction, 'Unknown selection. Please try again.')
            }
    }
}

/**
 * Handle individual role management actions
 */
async function handleIndividualRoleManagement(interaction, guildId, selectedValue) {
    const roleId = selectedValue.split('-')[0]
    const role = interaction.guild.roles.cache.get(roleId)
    
    if (!role) {
        return await safeReply(interaction, 'Invalid role ID. Please try again.')
    }

    const settingsEmbed = new EmbedBuilder()
        .setTitle('Manage Roles in Tickets')
        .setDescription(`What would you like to do with <@&${role.id}>?`)
        .setColor(0x0099ff)
        .setFooter({ text: 'Ticket System | Powered by Xylo', iconURL: config.developerInfo.icon })
        .setTimestamp()
    
    const editPermissionsButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-editRolePermissions-${role.id}`)
        .setLabel('Edit Permissions')
        .setStyle(ButtonStyle.Primary)

    const removeRoleButton = new ButtonBuilder()
        .setCustomId(`${guildId}-ticketSystem-removeRole-${role.id}`)
        .setLabel('Remove Role')
        .setStyle(ButtonStyle.Danger)

    const row = new ActionRowBuilder().addComponents(editPermissionsButton, removeRoleButton)

    return await safeReply(interaction, 'Role management options:', true)
        .then(() => interaction.followUp({ embeds: [settingsEmbed], components: [row], flags: MessageFlags.Ephemeral }))
}