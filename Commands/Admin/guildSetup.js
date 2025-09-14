import { ChatInputCommandInteraction, Message, MessageFlags, SlashCommandBuilder } from "discord.js"
import { logger } from "../../Utils/Tools/customLogger";
import { executeQuery } from "../../Utils/SQL/databaseManager";

export default {
    data: new SlashCommandBuilder()
        .setName('guildsetup')
        .setDescription('Set up the guild configuration.'),

    /**
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        logger("INFO", `Guild setup command invoked in guild ${interaction.guild.name} (${interaction.guild.id}) by user ${interaction.user.tag} (${interaction.user.id})`);

        let setupQuery = `INSERT INTO guilds (guildId, ownerId, isPaying) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ownerId = VALUES(ownerId), isPaying = VALUES(isPaying);`;
        await executeQuery(setupQuery, interaction.guild.id, interaction.guild.ownerId, 0);

        logger("INFO", `Guild ${interaction.guild.name} (${interaction.guild.id}) added to the database.`);
        logger("INFO", `Setting up default configurations for guild ${interaction.guild.name} (${interaction.guild.id})`);

        // Base query (safe upsert)
        const defaultConfigQuery = `INSERT INTO guild_configs (guildId, configType, configSettings) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE configSettings = VALUES(configSettings);`;
        logger("INFO", `Default configurations for guild ${interaction.guild.name} (${interaction.guild.id}) set up completed.`);


        // loggerSystem config
        let loggerConfig = {
            enabled: false,
            loggingLevel: 0,
            categoryParentID: null
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'loggerSystem', JSON.stringify(loggerConfig));

        // ticketSystem config
        let ticketSystemConfig = {
            enabled: false,
            categoryId: null,
            supportRoleId: null,
            ticketLimit: 1
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'ticketSystem', JSON.stringify(ticketSystemConfig));

        // welcomeSystem config
        let welcomeSystemConfig = {
            enabled: false,
            channelId: null,
            message: "Welcome to the server, {user}!"
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'welcomeSystem', JSON.stringify(welcomeSystemConfig));

        // farewellSystem config
        let farewellSystemConfig = {
            enabled: false,
            channelId: null,
            message: "Goodbye, {user}!"
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'farewellSystem', JSON.stringify(farewellSystemConfig));

        // autoRoleSystem config
        let autoRoleSystemConfig = {
            enabled: false,
            roleIds: []
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'autoRoleSystem', JSON.stringify(autoRoleSystemConfig));

        // reactionRoleSystem config
        let reactionRoleSystemConfig = {
            enabled: false,
            messageId: null,
            roleMappings: {}
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'reactionRoleSystem', JSON.stringify(reactionRoleSystemConfig));

        // messageFilteringSystem config
        let messageFilteringSystemConfig = {
            enabled: false,
            blacklistedWords: [],
            action: "delete"
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'messageFilteringSystem', JSON.stringify(messageFilteringSystemConfig));

        // antiSpamSystem config
        let antiSpamSystemConfig = {
            enabled: false,
            maxMessages: 5,
            intervalSeconds: 10,
            punishment: "mute"
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'antiSpamSystem', JSON.stringify(antiSpamSystemConfig));

        // antiRaidSystem config
        let antiRaidSystemConfig = {
            enabled: false,
            joinLimit: 5,
            intervalSeconds: 30,
            action: "ban"
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'antiRaidSystem', JSON.stringify(antiRaidSystemConfig));

        // serverProtectionSystem config
        let serverProtectionSystemConfig = {
            enabled: false,
            protectChannels: true,
            protectRoles: true
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'serverProtectionSystem', JSON.stringify(serverProtectionSystemConfig));

        // nicknameFilteringSystem config
        let nicknameFilteringSystemConfig = {
            enabled: false,
            forbiddenPatterns: []
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'nicknameFilteringSystem', JSON.stringify(nicknameFilteringSystemConfig));

        // ghostPingDetectionSystem config
        let ghostPingDetectionSystemConfig = {
            enabled: false,
            action: "warn"
        };
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'ghostPingDetectionSystem', JSON.stringify(ghostPingDetectionSystemConfig));

    }
}