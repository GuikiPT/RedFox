const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const colors = require('colors/safe');

const COMMAND_ERROR_MESSAGE = '❌ An error occurred while executing this command.';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role-info')
		.setDescription('Get detailed information about a role.')
		.addRoleOption(option =>
			option.setName('role')
				.setDescription('The role you want information about')
				.setRequired(true)
		)
		.addBooleanOption(option =>
			option.setName('private')
				.setDescription('Whether the response should be private (ephemeral)')
		),
	async execute(interaction) {
		const role = interaction.options.getRole('role');
		const isPrivate = interaction.options.getBoolean('private') || false;

		try {
			if (!role) {
				return interaction.reply({ content: '❌ Role not found!', ephemeral: true });
			}

			const roleInfoEmbed = createRoleInfoEmbed(role, interaction);

			await interaction.reply({ embeds: [roleInfoEmbed], ephemeral: isPrivate });
		} catch (error) {
			await handleCommandError(interaction, 'fetching role information', error, isPrivate);
		}
	},
};

function createRoleInfoEmbed(role, interaction) {
	return new EmbedBuilder()
		.setColor(role.hexColor || '#0099ff')
		.setTitle(`Role Information - ${role.name}`)
		.setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
		.addFields(
			{ name: 'Role Name', value: role.name, inline: true },
			{ name: 'Role ID', value: role.id, inline: true },
			{ name: 'Color', value: role.hexColor || 'Default', inline: true },
			{ name: 'Creation Date', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
			{ name: 'Position', value: `${role.rawPosition}`, inline: true },
			{ name: 'Member Count', value: `${role.members.size} members`, inline: true },
			{ name: 'Hoisted', value: role.hoist ? '✔️ Yes' : '❌ No', inline: true },
			{ name: 'Mentionable', value: role.mentionable ? '✔️ Yes' : '❌ No', inline: true },
			{ name: 'Permissions', value: role.permissions.toArray().map(p => `\`${p}\``).join(', ') || 'None', inline: false }
		);
}

async function handleCommandError(interaction, action, error, isPrivate) {
	const errorMessage = `${COMMAND_ERROR_MESSAGE} while ${action}. Please try again later.`;

	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: errorMessage, ephemeral: isPrivate });
		} else {
			await interaction.reply({ content: errorMessage, ephemeral: isPrivate });
		}
		console.error(colors.red(`Error ${action}: ${error.stack || error}`));
	} catch (errorHandlingError) {
		console.error(colors.red(`Failed to send error message: ${errorHandlingError.stack || errorHandlingError}`));
	}
}
