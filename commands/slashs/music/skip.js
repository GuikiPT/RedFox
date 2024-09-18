const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current track.'),

    async execute(interaction) {
        try {
            const player = interaction.client.poru.players.get(interaction.guild.id);

            // Check if the player exists
            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            // Stop the current track, which effectively skips it
            player.skip();

            // Create an embed to confirm the skip
            const skipEmbed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('⏭️ | Track Skipped')
                .setDescription('The current track has been skipped successfully.')
                .setTimestamp();

            await interaction.reply({ embeds: [skipEmbed] });

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
