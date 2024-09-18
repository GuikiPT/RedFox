const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the current track.'),
    
    async execute(interaction) {
        try {
            const player = interaction.client.poru.players.get(interaction.guild.id);

            // Check if the player exists
            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            // Check if the player is already paused
            if (player.isPaused) {
                const alreadyPausedEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('⏸ | Player is Already Paused')
                    .setDescription('The player is already paused.')
                    .setTimestamp();

                return interaction.reply({ embeds: [alreadyPausedEmbed], ephemeral: true });
            }

            // Pause the player
            player.pause(true);

            // Create an embed to confirm the pause
            const pausedEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('⏸ | Player Paused')
                .setDescription('The player has been paused successfully.')
                .setTimestamp();

            await interaction.reply({ embeds: [pausedEmbed] });

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
