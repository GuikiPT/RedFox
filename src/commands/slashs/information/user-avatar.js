const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user-avatar')
		.setDescription("Displays a user's avatar and banner if available.")
		.addUserOption(option =>
			option.setName('target')
				.setDescription('The user whose avatar and banner you want to view.')
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

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`${user.tag}'s Avatar and Banner`)
				.addFields({
					name: 'Avatar URL', 
					value: `[Avatar URL](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`, 
					inline: false
				})
				.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }));

			if (user.banner) {
				embed.setImage(user.bannerURL({ dynamic: true, size: 2048 }));
				embed.addFields({ 
					name: 'Banner URL', 
					value: `[Banner URL](${user.bannerURL({ dynamic: true, size: 2048 })})`, 
					inline: false 
				});
			} else {
				embed.addFields({
					name: 'Banner URL',
					value: 'No banner available.',
					inline: false
				});
			}

			await interaction.reply({ embeds: [embed], ephemeral: isPrivate });
		} catch (error) {
			console.error(`Error executing /user-avatar: ${error}`);
			const errorMessage = '❌ An error occurred while executing this command.';
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: errorMessage, ephemeral: true });
			} else {
				await interaction.reply({ content: errorMessage, ephemeral: true });
			}
		}
	},
};
