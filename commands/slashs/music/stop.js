const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Disconnects the player and leaves the voice channel.'),

    async execute(interaction) {
        try {
            const player = interaction.client.poru.players.get(interaction.guild.id);

            // Check if the player exists
            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            // Disconnect the player
            player.destroy();

            // Create an embed to confirm the disconnection
            const disconnectEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔌 | Player Disconnected')
                .setDescription('The player has been disconnected and the bot has left the voice channel.')
                .setTimestamp();

            await interaction.reply({ embeds: [disconnectEmbed] });

        } catch (err) {
            console.error(colors.red(err));

            // Error handling
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ | An error occurred while executing this command.', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ | An error occurred while executing this command.', ephemeral: true });
            }
        }
    },
};
