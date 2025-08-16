import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	Message,
	PermissionFlagsBits,
	EmbedBuilder
} from 'discord.js';
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
					description: 'The new prefix to set (1–5 characters)',
					type: ApplicationCommandOptionType.String,
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
		return this.handlePrefix(message);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.handlePrefix(interaction);
	}

	private async handlePrefix(interactionOrMessage: Message | Command.ChatInputCommandInteraction) {
		const guildId =
			interactionOrMessage instanceof Message
				? interactionOrMessage.guild?.id
				: interactionOrMessage.guild?.id;

		if (!guildId) {
			return this.respond(interactionOrMessage, '❌ This command can only be used in a server!', { ephemeral: true });
		}

		const hasManageGuild =
			interactionOrMessage instanceof Message
				? !!interactionOrMessage.member?.permissions.has(PermissionFlagsBits.ManageGuild)
				: !!interactionOrMessage.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

		if (!hasManageGuild) {
			return this.respond(interactionOrMessage, '❌ You need the "Manage Server" permission to change the prefix!', {
				ephemeral: true
			});
		}

		const newPrefix =
			interactionOrMessage instanceof Message
				? interactionOrMessage.content.split(' ').slice(1)[0]
				: interactionOrMessage.options.getString('new_prefix') ?? undefined;

		if (!newPrefix) {
			const currentPrefix = await this.getCurrentPrefix(guildId);
			const viewMsg =
				interactionOrMessage instanceof Message
					? `📝 Current prefix for this server: \`${currentPrefix}\`\n\nTo change it, use: \`${currentPrefix}prefix <new_prefix>\``
					: `📝 Current prefix for this server: \`${currentPrefix}\`\n\nTo change it, provide the \`new_prefix\` option in this command.`;

			return this.respond(interactionOrMessage, viewMsg, { ephemeral: true });
		}

		return this.updatePrefix(interactionOrMessage, guildId, newPrefix);
	}

	private async getCurrentPrefix(guildId: string): Promise<string> {
		const stored = await GuildService.getGuildPrefix(guildId);
		if (stored && stored.length > 0) return stored;

		const fallback =
			this.container.client.options.defaultPrefix?.toString() ||
			(this.container.client.user?.id ? `<@${this.container.client.user.id}>` : '!');
		return fallback;
	}

	private async respond(
		interactionOrMessage: Message | Command.ChatInputCommandInteraction,
		content: string,
		opts?: { ephemeral?: boolean }
	) {
		const embed = new EmbedBuilder().setDescription(content).setColor(0x5865f2);

		if (interactionOrMessage instanceof Message) {
			return interactionOrMessage.reply({ embeds: [embed] });
		}

		if (interactionOrMessage.deferred || interactionOrMessage.replied) {
			return interactionOrMessage.editReply({ embeds: [embed] });
		}

		return interactionOrMessage.reply({ embeds: [embed], ephemeral: opts?.ephemeral ?? false });
	}

	private async updatePrefix(
		interactionOrMessage: Message | Command.ChatInputCommandInteraction,
		guildId: string,
		newPrefix: string
	) {
		try {
			if (newPrefix.length === 0) {
				return this.respond(interactionOrMessage, '❌ Prefix cannot be empty!', { ephemeral: true });
			}

			if (newPrefix.length > 5) {
				return this.respond(interactionOrMessage, '❌ Prefix cannot be longer than 5 characters!', { ephemeral: true });
			}

			await GuildService.updateGuildPrefix(guildId, newPrefix);

			return this.respond(interactionOrMessage, `✅ Successfully updated the server prefix to: \`${newPrefix}\``, {
				ephemeral: false
			});
		} catch (error) {
			const msg =
				error instanceof Error
					? `❌ Error: ${error.message}`
					: '❌ An unexpected error occurred while updating the prefix.';
			return this.respond(interactionOrMessage, msg, { ephemeral: true });
		}
	}
}
