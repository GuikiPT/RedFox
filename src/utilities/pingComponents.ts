import { Utility } from '@sapphire/plugin-utilities-store';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	type MessageActionRowComponentBuilder
} from 'discord.js';

export class PingComponentsUtility extends Utility {
	public constructor(context: Utility.LoaderContext, options: Utility.Options) {
		super(context, {
			...options,
			name: 'pingComponents'
		});
	}

	public async createPingComponent(botLatency: number, apiLatency: number) {
		const components = [
			new ContainerBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### Discord Websocket Heartbeat\n\`\`\`\n${botLatency}ms\n\`\`\``),
				)
				.addSeparatorComponents(
					new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(`### Discord Websocket Heartbeat\n\`\`\`\n${apiLatency}ms\n\`\`\``),
				)
				.addSeparatorComponents(
					new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
				)
				.addActionRowComponents(
					new ActionRowBuilder<MessageActionRowComponentBuilder>()
						.addComponents(
							new ButtonBuilder()
								.setStyle(ButtonStyle.Primary)
								.setLabel("Refresh Ping")
								.setCustomId("b5b87603e6c84000b04ecc6b123dda9e"),
							new ButtonBuilder()
								.setStyle(ButtonStyle.Link)
								.setLabel("Discord Status")
								.setURL("https://discordstatus.com"),
						),
				),
		];
		return components;
	}
}

declare module '@sapphire/plugin-utilities-store' {
	export interface Utilities {
		pingComponents: PingComponentsUtility;
	}
}
