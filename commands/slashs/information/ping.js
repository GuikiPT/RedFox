const { SlashCommandBuilder } = require('discord.js');
const colors = require('colors/safe');

const COMMAND_ERROR_MESSAGE = '❌ An error occurred while executing this command.';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Displays the bot's current latency."),
	async execute(interaction) {
		try {
			const sent = await interaction.deferReply({ fetchReply: true });
			const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
			const apiLatency = Math.round(interaction.client.ws.ping);

			const latencyMessage = `🏓 Pong!\n\n**Bot Latency:** ${botLatency}ms\n**API Latency:** ${apiLatency}ms`;
			await interaction.followUp(latencyMessage);

			if (process.env.DEBUG) {
				console.log(colors.cyan(`[DEBUG] Bot Latency: ${botLatency}ms | API Latency: ${apiLatency}ms`));
			}
		} catch (error) {
			console.error(colors.red(error));

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: COMMAND_ERROR_MESSAGE, ephemeral: true });
			} else {
				await interaction.reply({ content: COMMAND_ERROR_MESSAGE, ephemeral: true });
			}
		}
	},
};
