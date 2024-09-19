const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the current track.'),
    
    async execute(interaction) {
        try {
            const { guild, client } = interaction;
            const player = client.poru.players.get(guild.id);

            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            if (!player.currentTrack) {
                return interaction.reply({ content: '❌ | No track is currently playing to pause.', ephemeral: true });
            }

            if (player.isPaused) {
                const alreadyPausedEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('⏸ | Player is Already Paused')
                    .setDescription('The player is already paused.')
                    .setTimestamp();

                return interaction.reply({ embeds: [alreadyPausedEmbed], ephemeral: true });
            }

            player.pause(true);

            const pausedEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('⏸ | Player Paused')
                .setDescription(`The player has been paused successfully. Paused track: **${player.currentTrack.info.title}**`)
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.member.displayName}`,
                    iconURL: interaction.member.displayAvatarURL()
                });

            await interaction.reply({ embeds: [pausedEmbed] });

        } catch (err) {
            console.error(colors.red('Error executing the pause command:', err));

            const errorMessage = '❌ | An error occurred while executing this command.';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
