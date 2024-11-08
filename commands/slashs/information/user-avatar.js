const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user-avatar')
		.setDescription("Displays a user's avatar.")
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user whose avatar you want to view.')
		),
	async execute(interaction) {
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

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error(`Error executing /user-avatar: ${error}`);
			await interaction.reply({ content: '❌ An error occurred while executing this command.', ephemeral: true });
		}
	},
};
