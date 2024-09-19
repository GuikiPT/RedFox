const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the paused track.'),
    
    async execute(interaction) {
        try {
            const { guild, client } = interaction;
            const player = client.poru.players.get(guild.id);

            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            if (!player.currentTrack) {
                return interaction.reply({ content: '❌ | No track is currently playing to resume.', ephemeral: true });
            }

            if (!player.isPaused) {
                const notPausedEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('▶️ | Player is Not Paused')
                    .setDescription('The player is not paused and is already playing.')
                    .setTimestamp();

                return interaction.reply({ embeds: [notPausedEmbed], ephemeral: true });
            }

            player.pause(false);

            const resumedEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('▶️ | Player Resumed')
                .setDescription(`The player has been resumed successfully. Now playing: **${player.currentTrack.info.title}**`)
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.member.displayName}`,
                    iconURL: interaction.member.displayAvatarURL()
                });

            await interaction.reply({ embeds: [resumedEmbed] });

        } catch (err) {
            console.error(colors.red('Error executing the resume command:', err));

            const errorMessage = '❌ | An error occurred while executing this command.';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
