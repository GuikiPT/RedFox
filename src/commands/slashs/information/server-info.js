const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server-info')
		.setDescription('Displays detailed information about the server.')
		.addBooleanOption(option => 
			option.setName('private')
				.setDescription('Whether the response should be private (ephemeral)')),
	async execute(interaction) {
		const isPrivate = interaction.options.getBoolean('private') || false;

		try {
			const guild = interaction.guild;
			const owner = await guild.fetchOwner();

			const memberStatus = {
				online: guild.members.cache.filter(m => m.presence?.status === 'online').size,
				idle: guild.members.cache.filter(m => m.presence?.status === 'idle').size,
				dnd: guild.members.cache.filter(m => m.presence?.status === 'dnd').size,
				offline: guild.memberCount - guild.members.cache.filter(m => m.presence?.status).size,
			};

			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`Guild Information - ${guild.name}`)
				.setThumbnail(guild.iconURL({ dynamic: true, size: 2048 }))
				.setDescription(`**Total Members**: ${guild.memberCount}\n**Online Members**: ${memberStatus.online}`)
				.addFields(
					{ name: 'Guild Name', value: guild.name, inline: true },
					{ name: 'ID', value: guild.id, inline: true },
					{ name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
					{ name: 'Owner', value: `${owner.user.tag}\n<@!${owner.user.id}>\n${owner.user.id}`, inline: true },
					{ name: 'Member Status', value: `🟢 Online: ${memberStatus.online}\n🌙 Idle: ${memberStatus.idle}\n⛔ DND: ${memberStatus.dnd}\n⚫ Offline: ${memberStatus.offline}`, inline: true },
					{ name: 'Server Icon', value: `[Click here](${guild.iconURL({ dynamic: true, size: 2048 })})`, inline: true }
				);

			if (guild.banner) {
				embed.setImage(guild.bannerURL({ dynamic: true, size: 2048 }));
				embed.addFields({ name: 'Banner', value: `[Click here](${guild.bannerURL({ dynamic: true, size: 2048 })})`, inline: true });
			}

			if (guild.premiumTier > 0) {
				embed.addFields(
					{ name: 'Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
					{ name: 'Total Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true }
				);
			}

			const features = guild.features.map(feature => `• ${feature.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`);
			embed.addFields({ 
				name: 'Features', 
				value: features.length > 0 ? features.join('\n') : 'No special features.', 
				inline: false 
			});

			await interaction.reply({ embeds: [embed], ephemeral: isPrivate });
		} catch (error) {
			await handleCommandError(interaction, 'retrieving server information', error, isPrivate);
		}
	},
};

async function handleCommandError(interaction, action, error, isPrivate) {
	const errorMessage = `❌ An error occurred while ${action}. Please try again later.`;

	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: errorMessage, ephemeral: isPrivate });
		} else {
			await interaction.reply({ content: errorMessage, ephemeral: isPrivate });
		}
		console.error(`Error ${action}: ${error.stack || error}`);
	} catch (replyError) {
		console.error(`Failed to send error message: ${replyError.stack || replyError}`);
	}
}
