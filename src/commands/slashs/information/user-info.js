const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const colors = require('colors/safe');

const COMMAND_ERROR_MESSAGE = '❌ An error occurred while executing this command.';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user-info')
		.setDescription('Displays information about a user.')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user to display information for')
		)
		.addBooleanOption(option =>
			option.setName('private')
				.setDescription('Whether the response should be private (ephemeral)')
		),
	async execute(interaction) {
		const isPrivate = interaction.options.getBoolean('private') || false;

		try {
			const user = interaction.options.getUser('target') || interaction.user;
			await user.fetch({ force: true });

			const member = await interaction.guild.members.fetch({ user, force: true }).catch(() => null);

			const createButtonRow = (activeButton) => new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('global_info')
						.setLabel('Global Info')
						.setStyle(activeButton === 'global_info' ? ButtonStyle.Primary : ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId('server_info')
						.setLabel('Server Info')
						.setStyle(activeButton === 'server_info' ? ButtonStyle.Primary : ButtonStyle.Secondary),
				);

			const globalInfoEmbed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`${user.tag}'s Global Information`)
				.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 2048 }))
				.addFields(
					{ name: 'Username', value: user.username, inline: true },
					{ name: 'Discriminator', value: `#${user.discriminator}`, inline: true },
					{ name: 'User ID', value: user.id, inline: true },
					{ name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
					{ name: 'Avatar', value: `[Click here](${user.displayAvatarURL({ dynamic: true, size: 2048 })})`, inline: true }
				);

			if (user.banner) {
				globalInfoEmbed.setImage(user.bannerURL({ dynamic: true, size: 2048 }));
				globalInfoEmbed.addFields({ name: 'Banner', value: `[Click here](${user.bannerURL({ dynamic: true, size: 2048 })})`, inline: true });
			}

			const serverInfoEmbed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`${member ? member.displayName : user.username}'s Server Information`)
				.setThumbnail(member ? member.displayAvatarURL({ dynamic: true, size: 2048 }) : user.displayAvatarURL({ dynamic: true, size: 2048 }))
				.addFields(
					{ name: 'Nickname', value: member ? member.displayName : 'No nickname', inline: true },
					{ name: 'User ID', value: user.id, inline: true },
					{ name: 'Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Not a member', inline: true },
					{
						name: 'Roles',
						value: member
							? member.roles.cache.size > 10
								? `${member.roles.cache.map(role => role.toString()).slice(0, 10).join(', ')}, and ${member.roles.cache.size - 10} more...`
								: member.roles.cache.map(role => role.toString()).join(', ')
							: 'None',
						inline: false
					}
				)
				.setFooter({ text: 'Note: Server-specific user banners are not supported by Discord API at this time.' });

			let activeEmbed = 'global_info';
			const row = createButtonRow(activeEmbed);

			const message = await interaction.reply({
				embeds: [globalInfoEmbed],
				components: [row],
				ephemeral: isPrivate,
				fetchReply: true
			});

			const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

			collector.on('collect', async i => {
				if (i.user.id !== interaction.user.id) {
					return i.reply({ content: "You can't interact with this button.", ephemeral: true });
				}

				collector.resetTimer();

				if (i.customId === 'global_info' && activeEmbed !== 'global_info') {
					activeEmbed = 'global_info';
					await i.update({ embeds: [globalInfoEmbed], components: [createButtonRow('global_info')] });
				} else if (i.customId === 'server_info' && activeEmbed !== 'server_info') {
					activeEmbed = 'server_info';
					await i.update({ embeds: [serverInfoEmbed], components: [createButtonRow('server_info')] });
				}
			});

			collector.on('end', async () => {
				const disabledRow = createButtonRow(activeEmbed).setComponents(
					new ButtonBuilder()
						.setCustomId('global_info')
						.setLabel('Global Info')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(true),
					new ButtonBuilder()
						.setCustomId('server_info')
						.setLabel('Server Info')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
				);
				await interaction.editReply({ components: [disabledRow] });
			});
		} catch (error) {
			await handleError(interaction, 'fetching user information', error, isPrivate);
		}
	},
};

async function handleError(interaction, action, error, isPrivate) {
	const errorMessage = `${COMMAND_ERROR_MESSAGE} while ${action}. Please try again later.`;

	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: errorMessage, ephemeral: isPrivate });
		} else {
			await interaction.reply({ content: errorMessage, ephemeral: isPrivate });
		}
		console.error(colors.red(`Error ${action}: ${error.stack || error}`));
	} catch (errorHandlingError) {
		console.error(colors.red(`Error handling command error: ${errorHandlingError.stack || errorHandlingError}`));
	}
}
