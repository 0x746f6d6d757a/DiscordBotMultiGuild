const { Client, GatewayIntentBits, Partials, Collection} = require('discord.js')
const { Guilds, GuildMessages, MessageContent, GuildVoiceStates} = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember} = Partials;

const config = require('../Configs/config.json')

const client = new Client({
    intents: [Guilds, GuildMember, GuildMessages, MessageContent, GuildVoiceStates, 'GuildMessageReactions'], 
    partials: [User, Message, GuildMember, ThreadMember]
})

const { loadEvents } = require('../Utils/Handlers/eventHandler');

client.events = new Collection();
client.commands = new Collection();

loadEvents(client)
client.login(config.token);