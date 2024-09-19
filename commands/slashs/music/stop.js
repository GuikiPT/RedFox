const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Disconnects the player and leaves the voice channel.'),

    async execute(interaction) {
        try {
            const { guild, client } = interaction;
            const player = client.poru.players.get(guild.id);

            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            if (!player.voiceChannel) {
                return interaction.reply({ content: '❌ | The bot is not connected to any voice channel.', ephemeral: true });
            }

            player.destroy();

            const disconnectEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔌 | Player Disconnected')
                .setDescription('The player has been disconnected and the bot has left the voice channel.')
                .setTimestamp();

            await interaction.reply({ embeds: [disconnectEmbed] });

        } catch (err) {
            console.error(colors.red('Error executing the stop command:', err));

            const errorMessage = '❌ | An error occurred while executing this command.';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
