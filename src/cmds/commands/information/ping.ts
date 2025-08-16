import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	Message,
	ContainerBuilder,
	SectionBuilder,
	ThumbnailBuilder,
	TextDisplayBuilder,
	MessageFlags
} from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'ping pong'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		];
		const contexts: InteractionContextType[] = [
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		];

		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addBooleanOption(opt =>
					opt.setName('ephemeral')
						.setDescription('Only you can see the response')
						.setRequired(false)
				)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
		);

		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message,
			integrationTypes,
			contexts
		});

		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User,
			integrationTypes,
			contexts
		});
	}

	public override async messageRun(message: Message) {
		return this.sendPing(message, false);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
		return this.sendPing(interaction, ephemeral);
	}

	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.sendPing(interaction, false);
	}

	private buildComponents(botLatency: number, apiLatency: number) {
		const client = this.container.client;
		const avatar = client.user?.displayAvatarURL({ size: 1024 }) ?? '';

		const text = new TextDisplayBuilder().setContent(
			[
				`**Bot Latency**`,
				'```',
				`${botLatency} ms`,
				'```',
				`**API Latency**`,
				'```',
				`${apiLatency} ms`,
				'```'
			].join('\n')
		);

		const section = new SectionBuilder()
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar))
			.addTextDisplayComponents(text);

		const container = new ContainerBuilder().addSectionComponents(section);

		return [container];
	}

	private async sendPing(
		interactionOrMessage:
			| Message
			| Command.ChatInputCommandInteraction
			| Command.ContextMenuCommandInteraction,
		ephemeral: boolean
	) {
		const apiLatency = Math.round(this.container.client.ws.ping);
		const botLatency = Date.now() - interactionOrMessage.createdTimestamp;

		const components = this.buildComponents(botLatency, apiLatency);
		const flags = MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0);

		if (interactionOrMessage instanceof Message) {
			return interactionOrMessage.reply({
				components,
				flags,
				allowedMentions: { parse: [] }
			});
		}

		return interactionOrMessage.reply({
			components,
			flags,
			allowedMentions: { parse: [] }
		});
	}
}
