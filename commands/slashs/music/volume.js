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
            const player = interaction.client.poru.players.get(interaction.guild.id);

            // Check if the player exists
            if (!player) {
                return interaction.reply({ content: '❌ | No player found in this server.', ephemeral: true });
            }

            // Check if the volume input is a valid number between 0 and 100
            if (volume < 0 || volume > 100) {
                return interaction.reply({ content: '❌ | Volume must be a number between 0 and 100.', ephemeral: true });
            }

            // Set the player volume
            player.setVolume(volume);

            // Create an embed to confirm the volume change
            const volumeEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🔊 | Volume Changed')
                .setDescription(`Volume has been set to **${volume}%**.`)
                .setTimestamp();

            await interaction.reply({ embeds: [volumeEmbed] });

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
