const { SlashCommandBuilder } = require('discord.js');
const colors = require('colors/safe');

const COMMAND_ERROR_MESSAGE = '❌ An error occurred while executing this command.';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Displays the bot's current latency.")
		.addBooleanOption(option =>
			option.setName('private')
				.setDescription('Whether the response should be private (ephemeral)')
		),
	async execute(interaction) {
		const isPrivate = interaction.options.getBoolean('private') || false;

		try {
			const sent = await interaction.deferReply({ fetchReply: true, ephemeral: isPrivate });
			const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
			const apiLatency = Math.round(interaction.client.ws.ping);

			const latencyMessage = `🏓 Pong!\n\n**Bot Latency:** ${botLatency}ms\n**API Latency:** ${apiLatency}ms`;
			await interaction.followUp({ content: latencyMessage, ephemeral: isPrivate });

			if (process.env.DEBUG) {
				console.log(colors.cyan(`[DEBUG] Bot Latency: ${botLatency}ms | API Latency: ${apiLatency}ms`));
			}
		} catch (error) {
			await handleCommandError(interaction, 'retrieving latency', error, isPrivate);
		}
	},
};

async function handleCommandError(interaction, action, error, isPrivate) {
	const errorMessage = `${COMMAND_ERROR_MESSAGE} while ${action}. Please try again later.`;

	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: errorMessage, ephemeral: isPrivate });
		} else {
			await interaction.reply({ content: errorMessage, ephemeral: isPrivate });
		}
		console.error(colors.red(`Error ${action}: ${error.stack || error}`));
	} catch (replyError) {
		console.error(colors.red(`Failed to send error message: ${replyError.stack || replyError}`));
	}
}
