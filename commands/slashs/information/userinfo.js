const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('colors/safe');

const COMMAND_ERROR_MESSAGE = '❌ An error occurred while executing this command.';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Displays information about a user.')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user to display information for')
		),
	async execute(interaction) {
		try {
			const user = interaction.options.getUser('target') || interaction.user;
			const member = await interaction.guild.members.fetch({ user, force: true }).catch(() => null);

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`${user.tag}'s Information`)
				.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 2048 }))
				.addFields(
					{ name: 'Username', value: user.username, inline: true },
					{ name: 'Discriminator', value: `#${user.discriminator}`, inline: true },
					{ name: 'User ID', value: user.id, inline: true },
					{ name: 'Mention', value: `<@${user.id}>`, inline: true },
					{ name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
					{ name: 'Avatar', value: `[Click here](${user.displayAvatarURL({ dynamic: true, size: 2048 })})`, inline: true }
				);

			if (user.banner) {
				embed.setImage(user.bannerURL({ dynamic: true, size: 2048 }));
				embed.addFields({ name: 'Banner', value: `[Click here](${user.bannerURL({ dynamic: true, size: 2048 })})`, inline: true });
			}

			if (member) {
				embed.addFields(
					{ name: 'Server Joined', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
					{ name: 'Highest Role', value: member.roles.highest.toString(), inline: true }
				);

				const roles = member.roles.cache
					.filter(role => role.id !== interaction.guild.id)
					.sort((a, b) => b.position - a.position)
					.map(role => role.toString());

				embed.addFields({
					name: 'Roles',
					value: roles.length > 50
						? `${roles.slice(0, 50).join(', ')} and ${roles.length - 50} more...`
						: roles.join(', ') || 'None',
					inline: false,
				});
			} else {
				embed.setFooter({ text: 'User is not a member of this server.' });
			}

			await interaction.reply({ embeds: [embed] });

			if (process.env.DEBUG) {
				console.log(colors.cyan(`[DEBUG] Fetched user info for: ${user.tag} (${user.id})`));
				console.log(colors.cyan(`[DEBUG] Banner: ${user.banner ? 'Yes' : 'No'} | Member of Server: ${member ? 'Yes' : 'No'}`));
			}
		} catch (error) {
			await handleError(interaction, error);
		}
	},
};

async function handleError(interaction, error) {
	try {
		console.error(colors.red(`Error executing /userinfo: ${error.stack || error}`));

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: COMMAND_ERROR_MESSAGE, ephemeral: true });
		} else {
			await interaction.reply({ content: COMMAND_ERROR_MESSAGE, ephemeral: true });
		}
	} catch (errorHandlingError) {
		console.error(colors.red(`Error handling command error: ${errorHandlingError.stack || errorHandlingError}`));
	}
}
