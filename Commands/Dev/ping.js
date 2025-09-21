import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js'
import config from '../../Configs/config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency and response time'),
    
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction 
     * @param {import('discord.js').Client} client
     */
    async execute(interaction, client) {
        const start = Date.now()
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        
        const end = Date.now()
        const responseTime = end - start
        const apiLatency = Math.round(client.ws.ping)
        
        // Determine ping quality
        let pingColor = 0x00FF00 // Green
        let pingQuality = 'Excellent'
        
        if (apiLatency > 100) {
            pingColor = 0xFFFF00 // Yellow
            pingQuality = 'Good'
        }
        if (apiLatency > 200) {
            pingColor = 0xFF8C00 // Orange
            pingQuality = 'Fair'
        }
        if (apiLatency > 500) {
            pingColor = 0xFF0000 // Red
            pingQuality = 'Poor'
        }
        
        const pingEmbed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor(pingColor)
            .setDescription('Bot latency and response time information')
            .addFields(
                { name: '📡 API Latency', value: `${apiLatency}ms`, inline: true },
                { name: '⚡ Response Time', value: `${responseTime}ms`, inline: true },
                { name: '📊 Connection Quality', value: pingQuality, inline: true }
            )
            .setFooter({ text: config.developerInfo.footerText, iconURL: config.developerInfo.icon })
            .setTimestamp()
        
        await interaction.editReply({ embeds: [pingEmbed] })
    }
}