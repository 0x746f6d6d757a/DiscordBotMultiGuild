import { Events, StringSelectMenuInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, Client, MessageFlags, StringSelectMenuBuilder, ActionRowBuilder, ButtonInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js'
import { logger } from '../../Utils/Tools/customLogger.js'
import { camelCaseToTitle } from '../../Utils/Tools/stringManager.js'
import config from '../../Configs/config.json' with { type: "json" }
import { loadGuildSettings, saveGuildSettings } from '../../Utils/SQL/guildSettingsManager.js'

export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     */
    async execute(interaction, client) {
        if (interaction.isStringSelectMenu()) return await stringSelectMenuInteractionHandler(interaction, client)
        if (interaction.isButton()) return await buttonIteractionHandler(interaction, client)
        if (interaction.isModalSubmit()) return await modalSubmitHandler(interaction, client)
    }
}

/**
 * @param {ButtonInteraction} interaction 
 * @param {Client} client 
 * @returns 
 */
async function buttonIteractionHandler(interaction, client) {
    if (!interaction.isButton()) return

    logger('INFO', `Button interaction received: ${interaction.customId} from user ${interaction.user.tag} (${interaction.user.id}) in guild ${interaction.guild.name} (${interaction.guild.id})`)

    const [guildId, system, action] = interaction.customId.split('-')
    if (!guildId || !system) return

    const guildSettings = await loadGuildSettings(guildId)
    if (!guildSettings) return interaction.reply({ content: 'No guild settings found.', flags: MessageFlags.Ephemeral })

    switch (system) {
        case 'loggerSystem':
            if (!guildSettings[system]) return interaction.reply({ content: 'Logger system settings not found.', flags: MessageFlags.Ephemeral })
            let loggerSystemConfig = guildSettings[system]

            switch (action) {
                case 'setEnable':
                    loggerSystemConfig.enabled = true
                    await saveGuildSettings(guildId, guildSettings)
                    return updateLoggerSystemMessage(interaction, guildId, loggerSystemConfig, 'Logging has been enabled.')

                case 'setDisable':
                    loggerSystemConfig.enabled = false
                    await saveGuildSettings(guildId, guildSettings)
                    const disableButton = interaction.message.components[0].components.map( button => ButtonBuilder.from(button))
                    return updateLoggerSystemMessage(interaction, guildId, loggerSystemConfig, 'Logging has been disabled.')

                case 'setAdminRole':
                    // Show modal to set admin role
                    const setAdminRoleModal = new ModalBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setAdminRole`)
                        .setTitle('Set Admin Role')

                    const adminRoleInput = new TextInputBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setAdminRole-input`)
                        .setLabel('Enter the Admin Role ID')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Role ID')
                        .setRequired(true)

                    setAdminRoleModal.addComponents(new ActionRowBuilder().addComponents(adminRoleInput))
                    return await interaction.showModal(setAdminRoleModal)

                case 'setCategory':

                    const setCategoryModal = new ModalBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setCategory`)
                        .setTitle('Set Category Channel')

                    const categoryInput = new TextInputBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setCategory-input`)
                        .setLabel('Enter the Category Channel ID')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Category ID')
                        .setRequired(true)

                    setCategoryModal.addComponents(new ActionRowBuilder().addComponents(categoryInput))
                    return await interaction.showModal(setCategoryModal)

                case 'setLoggingLevel':

                    const setLoggingLevelModal = new ModalBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setLoggingLevel`)
                        .setTitle('Set Logging Level (0-3)')

                    const loggingLevelInput = new TextInputBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setLoggingLevel-input`)
                        .setLabel('Enter the Logging Level (0-3)')
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(1)
                        .setPlaceholder('Logging Level')
                        .setRequired(true)

                    setLoggingLevelModal.addComponents(new ActionRowBuilder().addComponents(loggingLevelInput))
                    return await interaction.showModal(setLoggingLevelModal)

                default:
                    logger('ERROR', `Unknown action for logger system: ${action}`)
                    return interaction.reply({ content: 'Unknown action.', flags: MessageFlags.Ephemeral })
            }

        case 'save_settings':
            try {
                await saveGuildSettings(guildId, guildSettings)
                return interaction.reply({ content: 'Settings have been saved successfully.', flags: MessageFlags.Ephemeral })
            } catch (error) {
                logger('ERROR', `Failed to save settings for guild ${guildId}: ${error.stack}`)
                return interaction.reply({ content: 'Failed to save settings. Please try again.', flags: MessageFlags.Ephemeral })
            }

        case 'exit_settings':
            const mainMenuEmbed = new EmbedBuilder()
                .setTitle('Change Guild Settings')
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setDescription('Modify the settings for this guild using the dropdown menu below.')
                .setColor(0x5865F2)
                .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
                .setTimestamp()

            const selectMenuOptions = new StringSelectMenuBuilder()
                .setCustomId('select_guild_setting')
                .setPlaceholder('Select a setting to edit...')

            for (const [key] of Object.entries(guildSettings)) {
                selectMenuOptions.addOptions({
                    label: camelCaseToTitle(key),
                    description: `Edit the ${key} settings.`,
                    value: key
                })
            }

            const selectMenu = new ActionRowBuilder().addComponents(selectMenuOptions)
            return interaction.update({ embeds: [mainMenuEmbed], components: [selectMenu] })

        default:
            logger('ERROR', `Unknown system: ${system}`)
            return interaction.reply({ content: 'Unknown action.', flags: MessageFlags.Ephemeral })
    }
}

/**
 * @param {ModalSubmitInteraction} interaction
 * @param {Client} client
 */
async function modalSubmitHandler(interaction, client) {
    if (!interaction.isModalSubmit()) return   

    const [guildId, system, action] = interaction.customId.split('-')
    if (!guildId || !system || !action) return

    const guildSettings = await loadGuildSettings(guildId)
    if (!guildSettings) return interaction.reply({ content: 'No guild settings found.', flags: MessageFlags.Ephemeral })

    switch (system) {
        case 'loggerSystem':
            if (!guildSettings[system]) return interaction.reply({ content: 'Logger system settings not found.', flags: MessageFlags.Ephemeral })
            let loggerSystemConfig = guildSettings[system]
            switch (action) {
                case 'setAdminRole':
                    
                    const adminRoleId = interaction.fields.getTextInputValue(`${guildId}-loggerSystem-setAdminRole-input`)
                    const adminRole = interaction.guild.roles.cache.get(adminRoleId)
                    if (!adminRole) return interaction.reply({ content: 'Invalid role ID. Please try again.', flags: MessageFlags.Ephemeral })

                    loggerSystemConfig.adminRoleId = adminRoleId
                    await saveGuildSettings(guildId, guildSettings)
                    logger('INFO', `Admin role for logger system set to ${adminRole.name} (${adminRole.id}) in guild ${interaction.guild.name} (${interaction.guild.id})`)
                    return updateLoggerSystemMessage(interaction, guildId, loggerSystemConfig, `Admin role has been set to ${adminRole.name}.`)

                case 'setCategory':
                    const categoryId = interaction.fields.getTextInputValue(`${guildId}-loggerSystem-setCategory-input`)
                    const categoryChannel = interaction.guild.channels.cache.get(categoryId)
                    if (!categoryChannel || categoryChannel.type !== 4) return interaction.reply({ content: 'Invalid category channel ID. Please try again.', flags: MessageFlags.Ephemeral })

                    loggerSystemConfig.categoryParentID = categoryId
                    await saveGuildSettings(guildId, guildSettings)
                    logger('INFO', `Category channel for logger system set to ${categoryChannel.name} (${categoryChannel.id}) in guild ${interaction.guild.name} (${interaction.guild.id})`)
                    return updateLoggerSystemMessage(interaction, guildId, loggerSystemConfig, `Category channel has been set to ${categoryChannel.name}.`)

                case 'setLoggingLevel':
                    const loggingLevelInput = interaction.fields.getTextInputValue(`${guildId}-loggerSystem-setLoggingLevel-input`)
                    const loggingLevel = parseInt(loggingLevelInput)

                    if (isNaN(loggingLevel) || loggingLevel < 0 || loggingLevel > 3) {
                        return interaction.reply({ content: 'Invalid logging level. Please enter a number between 0 and 3.', flags: MessageFlags.Ephemeral })
                    }

                    loggerSystemConfig.loggingLevel = loggingLevel
                    await saveGuildSettings(guildId, guildSettings)
                    logger('INFO', `Logging level for logger system set to ${loggingLevel} in guild ${interaction.guild.name} (${interaction.guild.id})`)
                    return updateLoggerSystemMessage(interaction, guildId, loggerSystemConfig, `Logging level has been set to ${loggingLevel}.`)

                default:
                    logger('ERROR', `Unknown action for logger system modal: ${action}`)
                    return interaction.reply({ content: 'Unknown action.', flags: MessageFlags.Ephemeral })
            }
        default:
            logger('ERROR', `Unknown system for modal: ${system}`)
            return interaction.reply({ content: 'Unknown action.', flags: MessageFlags.Ephemeral })
    }   

}
/**
 * 
 * @param {StringSelectMenuInteraction} interaction 
 * @param {Client} client 
 * @returns 
 */
async function stringSelectMenuInteractionHandler(interaction, client) {
    if (!interaction.isStringSelectMenu()) return

    switch (interaction.customId) {
        case 'select_guild_setting':
            const selectedSetting = interaction.values[0]
            const guildId = interaction.guild.id
            const guildSettings = await loadGuildSettings(guildId)

            if (!guildSettings || !guildSettings[selectedSetting]) {
                logger('ERROR', `Guild settings not found for guild ID: ${guildId}`)
                return interaction.reply({ content: 'Guild settings not found.', flags: MessageFlags.Ephemeral })
            }

            switch(selectedSetting) {
                case 'loggerSystem':
                    const informationEmbed = new EmbedBuilder()
                        .setTitle('Logger System Settings')
                        .setDescription('Modify the settings for the Logger System using the buttons below.\n\nCurrent settings:')
                        .setFields(
                            { name: 'Logging Status:', value: guildSettings[selectedSetting].enabled ? 'Enabled.' : 'Disabled.' },
                            { name: 'Admin Role:', value: guildSettings[selectedSetting].adminRoleId ? `<@&${guildSettings[selectedSetting].adminRoleId}> (${guildSettings[selectedSetting].adminRoleId})` : 'Not Set.' },
                            { name: 'Category:', value: guildSettings[selectedSetting].categoryParentID ? `<#${guildSettings[selectedSetting].categoryParentID}> (${guildSettings[selectedSetting].categoryParentID})` : 'Not Set.' },
                            { name: 'Logging Level:', value: `${guildSettings[selectedSetting].loggingLevel}/3` }
                        )
                        .setColor(0x47346E)
                        .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
                        .setTimestamp()

                    const enableOption = new ButtonBuilder()
                        .setCustomId(guildSettings[selectedSetting].enabled ? `${guildId}-loggerSystem-setDisable` : `${guildId}-loggerSystem-setEnable`)
                        .setLabel(guildSettings[selectedSetting].enabled ? 'Disable Logging' : 'Enable Logging')
                        .setStyle(ButtonStyle.Secondary)

                    const setAdminRoleOption = new ButtonBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setAdminRole`)
                        .setLabel('Set Admin Role')
                        .setStyle(ButtonStyle.Secondary)

                    const setCategoryOption = new ButtonBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setCategory`)
                        .setLabel('Set Category')
                        .setStyle(ButtonStyle.Secondary)

                    const setLoggingLevelOption = new ButtonBuilder()
                        .setCustomId(`${guildId}-loggerSystem-setLoggingLevel`)
                        .setLabel('Set Logging Level')
                        .setStyle(ButtonStyle.Secondary)

                    const saveOption = new ButtonBuilder()
                        .setCustomId(`${guildId}-save_settings`)
                        .setLabel('Save Settings')
                        .setStyle(ButtonStyle.Primary)

                    const exitOption = new ButtonBuilder()
                        .setCustomId(`${guildId}-exit_settings`)
                        .setLabel('Return to Main Menu')
                        .setStyle(ButtonStyle.Primary)

                    const firstButtonActionRow = new ActionRowBuilder().addComponents(enableOption, setAdminRoleOption, setCategoryOption, setLoggingLevelOption)
                    const secondButtonActionRow = new ActionRowBuilder().addComponents(saveOption, exitOption)
                    return interaction.update({ embeds: [informationEmbed], components: [firstButtonActionRow, secondButtonActionRow] })

                case 'ticketSystem':
                    return interaction.reply({ content: 'Ticket system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'verificationSystem':
                    return interaction.reply({ content: 'Verification system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'welcomeSystem':
                    return interaction.reply({ content: 'Welcome system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'farewellSystem':
                    return interaction.reply({ content: 'Farewell system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'autoRoleSystem':
                    return interaction.reply({ content: 'Auto role system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'reactionRoleSystem':
                    return interaction.reply({ content: 'Reaction role system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'messageFilteringSystem':
                    return interaction.reply({ content: 'Message filtering system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'antiSpamSystem':
                    return interaction.reply({ content: 'Anti-spam system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'antiRaidSystem':
                    return interaction.reply({ content: 'Anti-raid system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'serverProtectionSystem':
                    return interaction.reply({ content: 'Server protection system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'nicknameFilteringSystem':
                    return interaction.reply({ content: 'Nickname filtering system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                case 'ghostPingDetectionSystem':
                    return interaction.reply({ content: 'Ghost ping detection system settings not implemented yet.', flags: MessageFlags.Ephemeral })

                default:
                    logger('ERROR', `Unknown setting selected for guild ID: ${guildId}, setting: ${selectedSetting}`)
                    return interaction.reply({ content: 'Unknown setting selected.', flags: MessageFlags.Ephemeral })
            }

        default:
            return
    }
}

/**
 * Create a logger system embed with current settings
 * @param {Object} loggerSystemConfig - The logger system configuration
 * @param {Guild} guild - The Discord guild object
 * @returns {EmbedBuilder} - The formatted embed
 */
function createLoggerSystemEmbed(loggerSystemConfig, guild) {
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
 * Create logger system buttons
 * @param {string} guildId - The guild ID
 * @param {Object} loggerSystemConfig - The logger system configuration
 * @returns {Array<ActionRowBuilder>} - Array of action rows with buttons
 */
function createLoggerSystemButtons(guildId, loggerSystemConfig) {
    const enableOption = new ButtonBuilder()
        .setCustomId(loggerSystemConfig.enabled ? `${guildId}-loggerSystem-setDisable` : `${guildId}-loggerSystem-setEnable`)
        .setLabel(loggerSystemConfig.enabled ? 'Disable Logging' : 'Enable Logging')
        .setStyle(ButtonStyle.Secondary);

    const setAdminRoleOption = new ButtonBuilder()
        .setCustomId(`${guildId}-loggerSystem-setAdminRole`)
        .setLabel('Set Admin Role')
        .setStyle(ButtonStyle.Secondary);

    const setCategoryOption = new ButtonBuilder()
        .setCustomId(`${guildId}-loggerSystem-setCategory`)
        .setLabel('Set Category')
        .setStyle(ButtonStyle.Secondary);

    const setLoggingLevelOption = new ButtonBuilder()
        .setCustomId(`${guildId}-loggerSystem-setLoggingLevel`)
        .setLabel('Set Logging Level')
        .setStyle(ButtonStyle.Secondary);

    const saveOption = new ButtonBuilder()
        .setCustomId(`${guildId}-save_settings`)
        .setLabel('Save Settings')
        .setStyle(ButtonStyle.Primary);

    const exitOption = new ButtonBuilder()
        .setCustomId(`${guildId}-exit_settings`)
        .setLabel('Return to Main Menu')
        .setStyle(ButtonStyle.Primary);

    const firstButtonActionRow = new ActionRowBuilder().addComponents(enableOption, setAdminRoleOption, setCategoryOption, setLoggingLevelOption);
    const secondButtonActionRow = new ActionRowBuilder().addComponents(saveOption, exitOption);
    
    return [firstButtonActionRow, secondButtonActionRow];
}

/**
 * Update the logger system message with current settings
 * @param {Interaction} interaction - The interaction object
 * @param {string} guildId - The guild ID
 * @param {Object} loggerSystemConfig - The logger system configuration
 * @param {string} replyMessage - Optional reply message
 */
async function updateLoggerSystemMessage(interaction, guildId, loggerSystemConfig, replyMessage = null) {
    const embed = createLoggerSystemEmbed(loggerSystemConfig, interaction.guild);
    const buttons = createLoggerSystemButtons(guildId, loggerSystemConfig);
    
    if (replyMessage) {
        await interaction.reply({ content: replyMessage, flags: MessageFlags.Ephemeral });
        const originalMessage = interaction.message || await interaction.fetchReply();
        if (originalMessage) await originalMessage.edit({ embeds: [embed], components: buttons });
        
    } else {
        await interaction.update({ embeds: [embed], components: buttons });
    }
}