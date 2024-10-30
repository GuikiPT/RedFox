const { SlashCommandBuilder } = require('discord.js');
const colors = require('colors/safe');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Displays the bot\'s current latency.'),
	async execute(interaction) {
		try {
			const sent = await interaction.deferReply({ fetchReply: true });
			const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
			const apiLatency = Math.round(interaction.client.ws.ping);

			await interaction.followUp(
				`🏓 Pong!\n\n**Bot Latency:** ${botLatency}ms\n**API Latency:** ${apiLatency}ms`
			);
		} catch (err) {
			console.error(colors.red(err));

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: '❌ An error occurred while executing this command.', ephemeral: true });
			} else {
				await interaction.reply({ content: '❌ An error occurred while executing this command.', ephemeral: true });
			}
		}
	},
};
