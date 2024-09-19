const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Sets the volume for the current track.')
        .addIntegerOption(option => 
            option
                .setName('amount')
                .setDescription('Volume level between 0 and 100.')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            const volume = interaction.options.getInteger('amount');
            const { guild, client } = interaction;
            const player = client.poru.players.get(guild.id);

            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            if (volume < 0 || volume > 100) {
                return interaction.reply({
                    content: `❌ | Volume must be a number between 0 and 100. Current volume is **${player.volume}%**.`,
                    ephemeral: true
                });
            }

            player.setVolume(volume);

            client.poru.playerVolumes.set(guild.id, volume);

            const volumeEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🔊 | Volume Changed')
                .setDescription(`Volume has been set to **${volume}%**.`)
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.member.displayName}`,
                    iconURL: interaction.member.displayAvatarURL()
                });

            await interaction.reply({ embeds: [volumeEmbed] });

        } catch (err) {
            console.error(colors.red('Error executing the volume command:', err));

            const errorMessage = '❌ | An error occurred while executing this command.';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
