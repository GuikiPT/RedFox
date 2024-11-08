const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user-avatar')
		.setDescription("Displays a user's avatar.")
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user whose avatar you want to view.')
		)
		.addBooleanOption(option =>
			option.setName('private')
				.setDescription('Whether the response should be private (ephemeral)')
		),
	async execute(interaction) {
		const isPrivate = interaction.options.getBoolean('private') || false;

		try {
			const user = interaction.options.getUser('target') || interaction.user;

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`${user.tag}'s Avatar`)
				.setDescription(`[Avatar URL](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`)
				.setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));

			if (user.avatarDecoration) {
				embed.addFields({
					name: 'Decoration URL',
					value: `[Decoration URL](${user.avatarDecorationURL()})`,
					inline: false
				});
			} else {
				embed.addFields({
					name: 'Decoration URL',
					value: 'No decoration available.',
					inline: false
				});
			}

			await interaction.reply({ embeds: [embed], ephemeral: isPrivate });
		} catch (error) {
			console.error(`Error executing /user-avatar: ${error}`);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: '❌ An error occurred while executing this command.', ephemeral: true });
			} else {
				await interaction.reply({ content: '❌ An error occurred while executing this command.', ephemeral: true });
			}
		}
	},
};
