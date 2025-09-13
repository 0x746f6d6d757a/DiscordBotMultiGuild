import fs from 'fs/promises'
import path from 'path'

import botConfig from '../../Configs/config.json' with { type: 'json' }

import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, PermissionOverwrites } from 'discord.js'
import { logger } from './customLogger.js'

/**
 * @param {Object} guildConfig 
 * @param {ChatInputCommandInteraction} interaction
*/
export async function setupLoggingSystem(config, interaction) {
    const guild = interaction.guild
    const guildConfig = config[guild.id]
    if (!guildConfig) return { message: `Please run the setup command first!` }

    const loggerConfig = guildConfig.loggerSystem
    if (!loggerConfig.enabled) return { message: `Logging is not enabled for this server.`, isLogging: false }

    if (loggerConfig.loggingLevel == 0) return { message: `Logging is disabled for this server.`, isLogging: false }

    const loggingCategoryID = loggerConfig.categoryParentID
    let categoryChannel = null
    if (!loggingCategoryID) {

        try {

            categoryChannel = await guild.channels.create({ name: 'Logging', type: ChannelType.GuildCategory })
            loggerConfig.categoryParentID = categoryChannel.id
            await fs.writeFile(path.join(process.cwd(), 'Configs', 'guilds.json'), JSON.stringify(config, null, 4))
            logger("INFO", `Created logging category in guild ${guild.name} (${guild.id})`)
            

        } catch (err) {
            console.error(err)
            logger("INFO", `Failed to create logging category in guild ${guild.name} (${guild.id})`)
            return { message: `Failed to create logging category.`, error: err, isLogging: false }
        }
    } else {
        categoryChannel = guild.channels.cache.get(loggingCategoryID)
    }

    logger("INFO", `Creating logging channels in guild ${guild.name} (${guild.id}) - Log level: ${loggerConfig.loggingLevel}`)

    const logChannelNames = {
        1: ['📁・ᴍᴇᴍʙᴇʀ_ʟᴏɢs', '📁・ɢᴜɪʟᴅ_ʟᴏɢs' ],
        2: ['📁・ᴄʜᴀɴɴᴇʟ_ʟᴏɢs', '📁・ᴍᴇssᴀɢᴇs_ʟᴏɢs', '📁・ʀᴏʟᴇ_ʟᴏɢs'],
        3: ['📁・ᴍᴏᴅᴇʀᴀᴛɪᴏɴ_ʟᴏɢs', '📁・ᴠᴏɪᴄᴇ_ᴄʜᴀɴɴᴇʟ_ʟᴏɢs', '📁・ɪɴᴠɪᴛᴇ_ʟᴏɢs']
    }

    const channelsToCreate = []
    for (let level = 1; level <= loggerConfig.loggingLevel; level++) {
        if (logChannelNames[level]) channelsToCreate.push(...logChannelNames[level])
    }

    const logChannelPermission = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: guild.ownerId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        },
        {
            id: botConfig.clientSettings.clientId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages
            ]
        }
    ]

    if( loggerConfig.adminRoleID ) {
        logChannelPermission.push({
            id: loggerConfig.adminRoleID,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ReadMessageHistory
            ]
        })
    }

    for (const channelName of channelsToCreate) {
        try {
            let existingChannel = guild.channels.cache.find(c => c.name === channelName && c.parentId === categoryChannel.id)
            if (!existingChannel) {
                existingChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: categoryChannel.id,
                    permissionOverwrites: logChannelPermission
                })
                logger("INFO", `Created logging channel ${channelName} in guild ${guild.name} (${guild.id})`)
            } else {
                logger("INFO", `Logging channel ${channelName} already exists in guild ${guild.name} (${guild.id})`)
            }
        } catch (err) {
            console.error(err)
            logger("INFO", `Failed to create logging channel ${channelName} in guild ${guild.name} (${guild.id})`)
            return { message: `Failed to create logging channel ${channelName}.`, error: err, isLogging: false }
        }
    }

    return { message: `Logging system setup completed successfully!`, isLogging: true }

}