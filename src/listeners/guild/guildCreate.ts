import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';
import { GuildService } from '../../database/models/guild';

export class UserEvent extends Listener<typeof Events.GuildCreate> {
	public override async run(guild: Guild) {
		try {
			// Create guild record with default prefix when bot joins
			await GuildService.getOrCreateGuild(guild.id, 'rf!');
			this.container.logger.info(`📥 Bot joined guild: ${guild.name} (${guild.id})`);
		} catch (error) {
			this.container.logger.error('Error creating guild record:', error);
		}
	}
}
