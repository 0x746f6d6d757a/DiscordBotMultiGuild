import { ChatInputCommandInteraction, EmbedBuilder, Message, MessageFlags, SlashCommandBuilder } from "discord.js"
import { logger } from "../../Utils/Tools/customLogger.js"
import { executeQuery } from "../../Utils/SQL/databaseManager.js"

export default {
    data: new SlashCommandBuilder()
        .setName('guildsetup')
        .setDescription('Set up the guild configuration.'),

    /**
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        if (!interaction.isCommand()) return

        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        logger("INFO", `Guild setup command invoked in guild ${interaction.guild.name} (${interaction.guild.id}) by user ${interaction.user.tag} (${interaction.user.id})`)
        logger("INFO", `Checking if guild ${interaction.guild.name} (${interaction.guild.id}) already exists in the database.`)

        const checkIfGuildExistsQuery = `SELECT * FROM guilds WHERE guildId = ?`
        const { rows } = await executeQuery(checkIfGuildExistsQuery, interaction.guild.id)

        if (rows.length > 0) {
            logger("INFO", `Guild setup command invoked in guild ${interaction.guild.name} (${interaction.guild.id}) by user ${interaction.user.tag} (${interaction.user.id}), but guild already exists in the database.`)
            return interaction.editReply({ content: "This guild has already been set up." })
        }

        let setupQuery = `INSERT INTO guilds (guildId, ownerId, isPaying) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ownerId = VALUES(ownerId), isPaying = VALUES(isPaying)`
        await executeQuery(setupQuery, interaction.guild.id, interaction.guild.ownerId, 0)

        logger("INFO", `Guild ${interaction.guild.name} (${interaction.guild.id}) added to the database.`)
        logger("INFO", `Setting up default configurations for guild ${interaction.guild.name} (${interaction.guild.id})`)

        // Base query (safe upsert)
        const defaultConfigQuery = `INSERT INTO guild_configs (guildId, configType, configSettings) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE configSettings = VALUES(configSettings)`


        // loggerSystem config
        let loggerConfig = {
            enabled: true,
            adminRoleId: null,
            categoryParentID: null,
            loggingLevel: 3
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'loggerSystem', JSON.stringify(loggerConfig))

        // ticketSystem config
        let ticketSystemConfig = {
            enabled: true,
            categoryId: null,
            staffRoleId: null,
            ticketLimit: 1,
            settings: [],
            type: 1
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'ticketSystem', JSON.stringify(ticketSystemConfig))

        // verificationSystem config
        let verificationSystemConfig = {
            enabled: false,
            type: 1,
            roleId: null,
            channelId: null,
            messageId: null,
            settings: []
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'verificationSystem', JSON.stringify(verificationSystemConfig))

        // welcomeSystem config
        let welcomeSystemConfig = {
            enabled: false,
            channelId: null,
            message: "Welcome to the server, {user}!",
            privateMessage: {
                enabled: false,
                message: "Welcome to the server, {user}! We're glad to have you here."
            }
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'welcomeSystem', JSON.stringify(welcomeSystemConfig))

        // farewellSystem config
        let farewellSystemConfig = {
            enabled: false,
            channelId: null,
            message: "Goodbye, {user}!",
            privateMessage: {
                enabled: false,
                message: "Goodbye, {user}! We're sad to see you go."
            }
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'farewellSystem', JSON.stringify(farewellSystemConfig))

        // autoRoleSystem config
        let autoRoleSystemConfig = {
            enabled: false,
            roleIds: []
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'autoRoleSystem', JSON.stringify(autoRoleSystemConfig))

        // reactionRoleSystem config
        let reactionRoleSystemConfig = {
            enabled: false,
            message: [ new EmbedBuilder() ],
            roleMappings: [ { emoji: null, roleId: null } ]
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'reactionRoleSystem', JSON.stringify(reactionRoleSystemConfig))

        // messageFilteringSystem config
        let messageFilteringSystemConfig = {
            enabled: false,
            blacklistedWords: [],
            action: { type: "delete" }
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'messageFilteringSystem', JSON.stringify(messageFilteringSystemConfig))

        // antiSpamSystem config
        let antiSpamSystemConfig = {
            enabled: false,
            maxMessages: 5,
            intervalSeconds: 10,
            punishment: { action: "mute", durationMinutes: 5 }
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'antiSpamSystem', JSON.stringify(antiSpamSystemConfig))

        // antiRaidSystem config
        let antiRaidSystemConfig = {
            enabled: false,
            joinLimit: 5,
            intervalSeconds: 30,
            action: { type: "ban" }
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'antiRaidSystem', JSON.stringify(antiRaidSystemConfig))

        // serverProtectionSystem config
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
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'serverProtectionSystem', JSON.stringify(serverProtectionSystemConfig))

        // nicknameFilteringSystem config
        let nicknameFilteringSystemConfig = {
            enabled: false,
            forbiddenPatterns: [],
            action: { type: "reset" }
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'nicknameFilteringSystem', JSON.stringify(nicknameFilteringSystemConfig))

        // ghostPingDetectionSystem config
        let ghostPingDetectionSystemConfig = {
            enabled: false,
            action: { type: "warn" }
        }
        await executeQuery(defaultConfigQuery, interaction.guild.id, 'ghostPingDetectionSystem', JSON.stringify(ghostPingDetectionSystemConfig))
        logger("INFO", `Default configurations for guild ${interaction.guild.name} (${interaction.guild.id}) set up completed.`)


        logger("INFO", `Guild setup process completed for guild ${interaction.guild.name} (${interaction.guild.id})`)
        await interaction.editReply({ content: "Your guild has been successfully set up with default configurations." })


    }
}