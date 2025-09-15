import { Events, StringSelectMenuInteraction } from 'discord.js'

export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     */
    async execute(interaction, client) {
        if (interaction.isStringSelectMenu()) return stringSelectMenuInteractionHandler(interaction, client);
    }
}


function stringSelectMenuInteractionHandler(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'select_guild_setting') return;

}