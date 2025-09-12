const { Events, Client, ActivityType } = require('discord.js')
const { loadCommands } = require('../../Utils/Handlers/commandHandler')

module.exports = {
    name: Events.ClientReady,
    once: true,
    /**
     * @param {Client} client 
    */
    async execute(client) {
        
        await loadCommands(client)
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity({ name: `Watching over ${client.guilds.cache.size} servers`, type: ActivityType.Watching})

    }
}