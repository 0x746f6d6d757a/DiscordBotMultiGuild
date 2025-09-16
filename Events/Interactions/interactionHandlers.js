import { Events, StringSelectMenuInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, Client, MessageFlags, StringSelectMenuBuilder, ActionRowBuilder, ButtonInteraction } from 'discord.js'
import { getGuildSettings } from '../../Commands/Admin/guildChangeSettings.js';
import { logger } from '../../Utils/Tools/customLogger.js';
import { camelCaseToTitle } from '../../Utils/Tools/stringManager.js'
import config from '../../Configs/config.json' with { type: "json" };

export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     */
    async execute(interaction, client) {
        if (interaction.isStringSelectMenu()) return await stringSelectMenuInteractionHandler(interaction, client)
        if (interaction.isButton()) return await buttonIteractionHandler(interaction, client)
        
    }
}

/**
 * 
 * @param {ButtonInteraction} interaction 
 * @param {Client} client 
 * @returns 
 */
async function buttonIteractionHandler(interaction, client) {
    if (!interaction.isButton()) return;

    const [guildId, system, action] = interaction.customId.split('-');
    if (!guildId || !system) return;

    const guildSettings = getGuildSettings(guildId);
    if (!guildSettings) return interaction.reply({ content: 'No guild settings found.', ephemeral: true });

    const settingsEmbed = EmbedBuilder.from(interaction.message.embeds[0])

    switch (system) {
        case 'loggerSystem':
            
            if (!guildSettings[system]) return interaction.reply({ content: 'Logger system settings not found.', ephemeral: true });
            let loggerSystemConfig = guildSettings[system];

            switch (action) {
                case 'setEnable':
                    loggerSystemConfig.enabled = true;
                    const enableButton = interaction.message.components[0].components.map( button => ButtonBuilder.from(button))
                    enableButton[0].setLabel('Disable Logging').setStyle(ButtonStyle.Danger).setCustomId(`${guildId}-loggerSystem-setDisable`);
                    settingsEmbed.setDescription(`Current settings for the Logger System:\n\n- **Enabled:** Yes\n- **Admin Role ID:** ${loggerSystemConfig.adminRoleId || 'Not Set'}\n- **Category ID:** ${loggerSystemConfig.categoryParentID || 'Not Set'}\n- **Logging Level:** ${loggerSystemConfig.loggingLevel}/3`);
                    return interaction.update({ components: [new ActionRowBuilder().addComponents(enableButton)], embeds: [settingsEmbed] });
                    break;

                case 'setDisable':
                    loggerSystemConfig.enabled = false;
                    const disableButton = interaction.message.components[0].components.map( button => ButtonBuilder.from(button))
                    disableButton[0].setLabel('Enable Logging').setStyle(ButtonStyle.Success).setCustomId(`${guildId}-loggerSystem-setEnable`);
                    settingsEmbed.setDescription(`Current settings for the Logger System:\n\n- **Enabled:** No\n- **Admin Role ID:** ${loggerSystemConfig.adminRoleId || 'Not Set'}\n- **Category ID:** ${loggerSystemConfig.categoryParentID || 'Not Set'}\n- **Logging Level:** ${loggerSystemConfig.loggingLevel}/3`);
                    return interaction.update({ components: [new ActionRowBuilder().addComponents(disableButton)], embeds: [settingsEmbed] });
                    break;

                case 'setAdminRole':
                    return interaction.reply({ content: 'Please mention the admin role in chat.', ephemeral: true });
                case 'setCategory':
                    return interaction.reply({ content: 'Please mention the category channel in chat.', ephemeral: true });
                case 'setLoggingLevel':
                    return interaction.reply({ content: 'Please enter the logging level (0-3) in chat.', ephemeral: true });
                default:
                    logger('ERROR', `Unknown action for logger system: ${action}`);
                    return interaction.reply({ content: 'Unknown action.', ephemeral: true });

            }

        case 'exit_settings':

            const mainMenuEmbed = new EmbedBuilder()
                .setTitle('Change Guild Settings')
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setDescription('Modify the settings for this guild using the dropdown menu below.')
                .setColor(0x5865F2)
                .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
                .setTimestamp();

            const selectMenuOptions = new StringSelectMenuBuilder()
                .setCustomId('select_guild_setting')
                .setPlaceholder('Select a setting to edit...');

            for (const [key] of Object.entries(guildSettings)) {
                selectMenuOptions.addOptions({
                    label: camelCaseToTitle(key),
                    description: `Edit the ${key} settings.`,
                    value: key
                });
            }

            const selectMenu = new ActionRowBuilder().addComponents(selectMenuOptions);
            return interaction.update({ embeds: [mainMenuEmbed], components: [selectMenu] });

        default:
            logger('ERROR', `Unknown system: ${system}`);
            return interaction.reply({ content: 'Unknown action.', ephemeral: true });
    }
}


/**
 * 
 * @param {StringSelectMenuInteraction} interaction 
 * @param {Client} client 
 * @returns 
 */
async function stringSelectMenuInteractionHandler(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    switch (interaction.customId) {
        case 'select_guild_setting':
            
            const selectedSetting = interaction.values[0];
            const guildId = interaction.guild.id;
            const guildSettings = getGuildSettings(guildId);

            if (!guildSettings || !guildSettings[selectedSetting]) {
                logger('ERROR', `Guild settings not found for guild ID: ${guildId}`);
                return interaction.reply({ content: 'Guild settings not found.', ephemeral: true });
            }
            if (!guildSettings[selectedSetting]) {
                logger('ERROR', `Selected setting not found for guild ID: ${guildId}, setting: ${selectedSetting}`);
                return interaction.reply({ content: 'Selected setting not found.', ephemeral: true });
            }

            switch(selectedSetting) {
                case 'loggerSystem':
                    let loggerSystemConfig = {
                        enabled: true,
                        adminRoleId: null,
                        categoryParentID: null,
                        loggingLevel: 3
                    }
                    // Handle logger system settings
                    const informationEmbed = new EmbedBuilder()
                        .setTitle('Logger System Settings')
                        .setDescription(`Current settings for the Logger System:\n\n- **Enabled:** ${guildSettings[selectedSetting].enabled ? 'Yes' : 'No'}\n- **Admin Role ID:** ${guildSettings[selectedSetting].adminRoleId || 'Not Set'}\n- **Category ID:** ${guildSettings[selectedSetting].categoryParentID || 'Not Set'}\n- **Logging Level:** ${guildSettings[selectedSetting].loggingLevel}/3`)
                        .setColor(0x5865F2)
                        .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
                        .setTimestamp();

                    const enableOption = new ButtonBuilder()
                        .setCustomId(guildSettings[selectedSetting].enabled ? `${guildId}-loggerSystem-setDisable` : `${guildId}-loggerSystem-setEnable`)
                        .setLabel(guildSettings[selectedSetting].enabled ? 'Disable Logging' : 'Enable Logging')
                        .setStyle(guildSettings[selectedSetting].enabled ? ButtonStyle.Danger : ButtonStyle.Success);

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

                    const exitOption = new ButtonBuilder()
                        .setCustomId(`${guildId}-exit_settings`)
                        .setLabel('Return to Main Menu')
                        .setStyle(ButtonStyle.Danger);

                    const buttonActionRow = new ActionRowBuilder().addComponents(enableOption, setAdminRoleOption, setCategoryOption, setLoggingLevelOption, exitOption);
                    return interaction.update({ embeds: [informationEmbed], components: [buttonActionRow], flags: MessageFlags.Ephemeral });

                    break;
                case 'ticketSystem':
                    let ticketSystemConfig = {
                        enabled: true,
                        categoryId: null,
                    }
                    // Handle ticket system settings
                    break;
                case 'verificationSystem':
                    let verificationSystemConfig = {
                        enabled: false,
                        type: 1,
                    }
                    // Handle verification system settings
                    break;
                case 'welcomeSystem':
                    let welcomeSystemConfig = {
                        enabled: false,
                        channelId: null,
                        message: "Welcome to the server, {user}!",
                        privateMessage: {
                            enabled: false,
                            message: "Welcome to the server, {user}! We're glad to have you here."
                        }
                    }
                    // Handle welcome system settings
                    break;
                case 'farewellSystem':
                    let farewellSystemConfig = {
                        enabled: false,
                        channelId: null,
                        message: "Goodbye {user}, we hope to see you again!",
                        privateMessage: {
                            enabled: false,
                            message: "Goodbye {user}, we're sad to see you go!"
                        }
                    }
                    // Handle farewell system settings
                    break;
                case 'autoRoleSystem':
                    let autoRoleSystemConfig = {
                        enabled: false,
                        roleIds: []
                    }
                    // Handle auto role system settings
                    break;
                case 'reactionRoleSystem':
                    let reactionRoleSystemConfig = {
                        enabled: false,
                        message: [ new EmbedBuilder() ],
                        roleMappings: [ { emoji: null, roleId: null } ]
                    }
                    // Handle reaction role system settings
                    break;
                case 'messageFilteringSystem':
                    let messageFilteringSystemConfig = {
                        enabled: false,
                        blacklistedWords: [],
                        action: { type: "delete" }
                    }
                    // Handle message filtering system settings
                    break;
                case 'antiSpamSystem':
                    let antiSpamSystemConfig = {
                        enabled: false,
                        maxMessages: 5,
                    }
                    // Handle anti-spam system settings
                    break;
                case 'antiRaidSystem':
                    let antiRaidSystemConfig = {
                        enabled: false,
                        joinLimit: 5,
                    }
                    // Handle anti-raid system settings
                    break;
                case 'serverProtectionSystem':
                    let serverProtectionSystemConfig = {
                        enabled: true,
                        protectChannels: true,
                        protectRoles: true,
                        protectPermissions: true,
                        timeFrameMinutes: 5,
                        threshold: 2,
                        action: { type: "ban" },
                        trustedRoles: [],
                        trustedUsers: [],
                        logChannelId: null,
                        backupRetention: 7
                    }
                    // Handle server protection system settings
                    break;
                case 'nicknameFilteringSystem':
                    let nicknameFilteringSystemConfig = {
                        enabled: false,
                        forbiddenPatterns: [],
                        action: { type: "reset" }
                    }
                    // Handle nickname filtering system settings
                    break;
                case 'ghostPingDetectionSystem':
                    let ghostPingDetectionSystemConfig = {
                        enabled: false,
                        action: { type: "warn" }
                    }

                    // Handle ghost ping detection system settings
                    break;

                default:
                    logger('ERROR', `Unknown setting selected for guild ID: ${guildId}, setting: ${selectedSetting}`);
                    return interaction.reply({ content: 'Unknown setting selected.', ephemeral: true });
            }


        default:
            return;
    }

}