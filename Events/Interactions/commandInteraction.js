import { ChatInputCommandInteraction, Events, MessageFlags } from 'discord.js'

export default {
    name: Events.InteractionCreate,
    /**
     * @param {ChatInputCommandInteraction} interaction
    */
    execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return
        
        const command = client.commands.get(interaction.commandName)
        if (!command) return interaction.reply({ content: 'This command is not working, please report this to an admin.', flags: MessageFlags.Ephemeral })
            
        Promise.resolve(command.execute(interaction, client)).catch(() => {
            (interaction.replied || interaction.deferred)
                ? interaction.followUp({ content: 'There was an error.', flags: MessageFlags.Ephemeral })
                : interaction.reply({ content: 'There was an error.', flags: MessageFlags.Ephemeral })
        })
    }
}