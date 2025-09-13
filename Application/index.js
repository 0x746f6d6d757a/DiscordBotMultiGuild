import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js'
import util from 'util'

import { logger } from '../Utils/Tools/customLogger.js'
import { loadEvents } from '../Utils/Handlers/eventHandler.js'
const { Guilds, GuildMessages, MessageContent, GuildVoiceStates } = GatewayIntentBits
const { User, Message, GuildMember, ThreadMember } = Partials

import config from '../Configs/config.json' with { type: 'json' }

const client = new Client({
    intents: [Guilds, GuildMember, GuildMessages, MessageContent, GuildVoiceStates, 'GuildMessageReactions'],
    partials: [User, Message, GuildMember, ThreadMember]
})

client.events = new Collection()
client.commands = new Collection()

loadEvents(client)
client.login(config.token)

process.on('warning', (warning) => {
    logger('WARN', `Node.js Warning: ${warning.stack || warning}`)
})

process.on('unhandledRejection', (reason, promise) => {
    logger('ERROR', `Unhandled Rejection: ${util.inspect(reason, { depth: null })} \n Promise: ${util.inspect(promise, { depth: null })}`)
})

process.on('uncaughtException', (error) => {
    logger('ERROR', `Uncaught Exception: ${util.inspect(error, { depth: null })}`)
})