import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';
import { GuildService } from '../../database/models/guild';

export class UserEvent extends Listener<typeof Events.GuildUpdate> {
	public override async run(oldGuild: Guild, newGuild: Guild) {
		// Handle guild updates (name changes, etc.)
		try {
			// Ensure guild exists in database
			await GuildService.getOrCreateGuild(newGuild.id);
			
			// Log significant changes
			if (oldGuild.name !== newGuild.name) {
				this.container.logger.info(`Guild renamed: "${oldGuild.name}" → "${newGuild.name}" (${newGuild.id})`);
			}
		} catch (error) {
			this.container.logger.error('Error handling guild update:', error);
		}
	}
}
