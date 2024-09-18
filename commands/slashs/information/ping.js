const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Displays the bot\'s current latency.'),
	async execute(interaction) {
		try {
			const reply = await interaction.reply({ content: '<a:DiscordLoading:1278286038372057178>', fetchReply: true });

			const ping = reply.createdTimestamp - interaction.createdTimestamp;

			const botUser = await interaction.client.user.fetch({ force: true });

			const pingEmbed = new EmbedBuilder()
				.setColor('Red')
				.setTitle('🏓 | Pong!')
				.setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: false, size: 1024, format: 'png' }))
				.addFields(
					{ name: '**Bot Latency**', value: `\`\`\`ini\n [ ${ping}ms ]\n\`\`\``, inline: true },
					{ name: '**API Connection Latency**', value: `\`\`\`ini\n [ ${Math.round(interaction.client.ws.ping)}ms ]\n\`\`\``, inline: true }
				)
				.setTimestamp();

			if (botUser.banner) {
				const bannerURL = botUser.bannerURL({ size: 2048, format: 'png' });
				pingEmbed.setImage(bannerURL);
			}

			await interaction.editReply({ content: '', embeds: [pingEmbed] });

		} catch (err) {
			console.error(colors.red(err));

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: '❌ | An error occurred while executing this command.', ephemeral: true });
			} else {
				await interaction.reply({ content: '❌ | An error occurred while executing this command.', ephemeral: true });
			}
		}
	},
};
