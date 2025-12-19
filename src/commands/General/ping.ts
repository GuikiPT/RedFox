import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, type Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'ping pong'
})
export class UserCommand extends Command {
	// Register slash and context menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Create shared integration types and contexts
		// These allow the command to be used in guilds and DMs
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
		const contexts: InteractionContextType[] = [
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		];

		// Register slash command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addBooleanOption((option) =>
					option
						.setName('ephemeral')
						.setDescription('Whether the response should be visible only to you (default: true)')
						.setRequired(false)
				)
		);

		// Register context menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message,
			integrationTypes,
			contexts
		});

		// Register context menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User,
			integrationTypes,
			contexts
		});
	}

	// Message command
	public override async messageRun(message: Message) {
		const pingMessage = await send(message, '<a:DiscordLoading:1451612060868808780>');

		const botLatency = Math.round(this.container.client.ws.ping);
		const apiLatency = (pingMessage.editedTimestamp || pingMessage.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp);

		const pingComponents = await this.container.utilities.pingComponents.createPingComponent(botLatency, apiLatency);

		return await send(message, { content: '', components: pingComponents, flags: ['IsComponentsV2'] });
	}

	// slash command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
		await interaction.deferReply({ ephemeral });
		const msg = await interaction.fetchReply();

		const botLatency = Math.round(this.container.client.ws.ping);
		const apiLatency = msg.createdTimestamp - interaction.createdTimestamp;

		const pingComponents = await this.container.utilities.pingComponents.createPingComponent(botLatency, apiLatency);

		return interaction.editReply({ content: '', components: pingComponents, flags: ['IsComponentsV2'] });
	}

	// context menu command
	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		await interaction.deferReply();
		const msg = await interaction.fetchReply();

		const botLatency = Math.round(this.container.client.ws.ping);
		const apiLatency = msg.createdTimestamp - interaction.createdTimestamp;

		const pingComponents = await this.container.utilities.pingComponents.createPingComponent(botLatency, apiLatency);

		return interaction.editReply({ content: '', components: pingComponents, flags: ['IsComponentsV2'] });
	}
}
