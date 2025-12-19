import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import type { InteractionUpdateOptions } from 'discord.js';

export class RefreshPingButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button
		});
	}

	public override parse(interaction: ButtonInteraction) {
		// Check if this is our refresh ping button
		if (interaction.customId !== 'b5b87603e6c84000b04ecc6b123dda9e') return this.none();

		return this.some();
	}

	public async run(interaction: ButtonInteraction) {
		// Defer the update to show loading state
		const updateStart = Date.now();
		await interaction.deferUpdate();

		// Calculate API latency based on defer time
		const apiLatency = Date.now() - updateStart;

		// Get bot latency (heartbeat)
		const botLatency = Math.round(this.container.client.ws.ping);

		// Use the utilities store to create the ping components
		const pingComponents = await this.container.utilities.pingComponents.createPingComponent(botLatency, apiLatency);

		// Update the message with fresh latency data
		return interaction.editReply({ content: '', components: pingComponents, flags: ['IsComponentsV2'] } as InteractionUpdateOptions);
	}
}
