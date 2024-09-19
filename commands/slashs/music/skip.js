const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current track.'),

    async execute(interaction) {
        try {
            const { guild, client } = interaction;
            const player = client.poru.players.get(guild.id);

            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            if (!player.currentTrack) {
                return interaction.reply({ content: '❌ | No track is currently playing to skip.', ephemeral: true });
            }

            player.skip();

            const nextTrack = player.queue[0];

            const skipEmbed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('⏭️ | Track Skipped')
                .setDescription(
                    nextTrack
                        ? `The current track has been skipped. Now playing: **${nextTrack.info.title}**.`
                        : 'The current track has been skipped, but there are no more tracks in the queue.'
                )
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.member.displayName}`,
                    iconURL: interaction.member.displayAvatarURL()
                });

            await interaction.reply({ embeds: [skipEmbed] });

        } catch (err) {
            console.error(colors.red('Error executing the skip command:', err));

            const errorMessage = '❌ | An error occurred while executing this command.';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
