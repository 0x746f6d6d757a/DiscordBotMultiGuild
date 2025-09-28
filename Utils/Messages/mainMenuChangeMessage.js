import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChatInputCommandInteraction } from 'discord.js'
import config from '../../Configs/config.json' with { type: 'json' }
import { camelCaseToTitle } from '../../Utils/Tools/stringManager.js'

/**
 * 
 * @param {*} guildSettings 
 * @param {ChatInputCommandInteraction} interaction 
 * @returns 
 */
function generateActionRow(guildSettings, interaction) {

    const selectMenuOptions = new StringSelectMenuBuilder()
        .setCustomId(`select_guild_setting`)
        .setPlaceholder('Select a setting to edit...')

    for (const [key, value] of Object.entries(guildSettings)) {
        selectMenuOptions.addOptions({
            label: camelCaseToTitle(key),
            description: `Edit the ${key} settings.`,
            value: key
        })
    }
    
    return [new ActionRowBuilder().addComponents(selectMenuOptions)]
}

function generateEmbed(interaction) {
    return new EmbedBuilder()
        .setTitle('Change Guild Settings')
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setDescription('Modify the settings for this guild using the dropdown menu below.')
        .setColor(0x5865F2)
        .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
        .setTimestamp()
}


export default async function sendMainMenuMessage(interaction, guildSettings, replyMessage = null) {
    const actionRow = generateActionRow(guildSettings, interaction);
    const embed = generateEmbed(interaction);

    if (replyMessage) {
        await interaction.reply({ content: replyMessage, flags: MessageFlags.Ephemeral });
        const originalMessage = interaction.message || await interaction.fetchReply();
        if (originalMessage) await originalMessage.edit({ embeds: [embed], components: actionRow });
        
    } else {
        try {
            await interaction.update({ embeds: [embed], components: actionRow });
        } catch (error) {
            await interaction.reply({ embeds: [embed], components: actionRow });
        }
    }

}

