import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, InteractionContextType, Message } from 'discord.js';
import { GuildService } from '../../database/models/guild';

@ApplyOptions<Command.Options>({
	description: 'Set or view the custom prefix for this guild',
	preconditions: ['GuildOnly']
})
export class PrefixCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					name: 'new_prefix',
					description: 'The new prefix to set (1-5 characters)',
					type: 3,
					required: false,
					minLength: 1,
					maxLength: 5
				}
			],
			integrationTypes,
			contexts
		});
	}

	public override async messageRun(message: Message) {
		if (!message.guild) {
			return message.reply('❌ This command can only be used in a server!');
		}

		if (!message.member?.permissions.has('ManageGuild')) {
			return message.reply('❌ You need the "Manage Server" permission to change the prefix!');
		}

		const args = message.content.split(' ').slice(1);
		const newPrefix = args[0];

		if (!newPrefix) {
			const currentPrefix = await GuildService.getGuildPrefix(message.guild.id);
			return message.reply(`📝 Current prefix for this server: \`${currentPrefix}\`\n\nTo change it, use: \`${currentPrefix}prefix <new_prefix>\``);
		}

		return this.updatePrefix(message, message.guild.id, newPrefix);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.guild) {
			return interaction.reply({ content: '❌ This command can only be used in a server!', ephemeral: true });
		}

		if (!interaction.memberPermissions?.has('ManageGuild')) {
			return interaction.reply({ 
				content: '❌ You need the "Manage Server" permission to change the prefix!', 
				ephemeral: true 
			});
		}

		const newPrefix = interaction.options.getString('new_prefix');

		if (!newPrefix) {
			const currentPrefix = await GuildService.getGuildPrefix(interaction.guild.id);
			return interaction.reply({
				content: `📝 Current prefix for this server: \`${currentPrefix}\`\n\nTo change it, use the \`new_prefix\` option in this command.`,
				ephemeral: true
			});
		}

		return this.updatePrefix(interaction, interaction.guild.id, newPrefix);
	}

	private async updatePrefix(
		interactionOrMessage: Message | Command.ChatInputCommandInteraction,
		guildId: string,
		newPrefix: string
	) {
		try {
			if (newPrefix.length === 0) {
				const errorMsg = '❌ Prefix cannot be empty!';
				return interactionOrMessage instanceof Message 
					? interactionOrMessage.reply(errorMsg)
					: interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
			}

			if (newPrefix.length > 5) {
				const errorMsg = '❌ Prefix cannot be longer than 5 characters!';
				return interactionOrMessage instanceof Message 
					? interactionOrMessage.reply(errorMsg)
					: interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
			}

			await GuildService.updateGuildPrefix(guildId, newPrefix);

			const successMsg = `✅ Successfully updated the server prefix to: \`${newPrefix}\``;
			
			if (interactionOrMessage instanceof Message) {
				return interactionOrMessage.reply(successMsg);
			} else {
				return interactionOrMessage.reply({ 
					content: successMsg,
					ephemeral: false
				});
			}

		} catch (error) {
			console.error('Error updating prefix:', error);
			
			const errorMsg = error instanceof Error 
				? `❌ Error: ${error.message}`
				: '❌ An unexpected error occurred while updating the prefix.';
			
			if (interactionOrMessage instanceof Message) {
				return interactionOrMessage.reply(errorMsg);
			} else {
				return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
			}
		}
	}
}
