const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the paused track.'),
    
    async execute(interaction) {
        try {
            const player = interaction.client.poru.players.get(interaction.guild.id);

            // Check if the player exists
            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            // Check if the player is paused
            if (!player.isPaused) {
                const notPausedEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('▶️ | Player is Not Paused')
                    .setDescription('The player is not paused.')
                    .setTimestamp();

                return interaction.reply({ embeds: [notPausedEmbed], ephemeral: true });
            }

            // Resume the player
            player.pause(false);

            // Create an embed to confirm the resume
            const resumedEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('▶️ | Player Resumed')
                .setDescription('The player has been resumed successfully.')
                .setTimestamp();

            await interaction.reply({ embeds: [resumedEmbed] });

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
