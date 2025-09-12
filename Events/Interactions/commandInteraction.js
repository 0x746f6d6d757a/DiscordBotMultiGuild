const { ChatInputCommandInteraction, Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    /**
     * @param {ChatInputCommandInteraction} interaction
    */
    execute(interaction, client) {
        if(!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if(!command) return interaction.reply({ content: 'This command is not working, please report this to an admin.', flags: MessageFlags.Ephemeral });
          
        command.execute(interaction, client)
    }
}