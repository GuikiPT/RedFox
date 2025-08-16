import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Guild } from 'discord.js';
import { GuildService } from '../../database/models/guild';

export class UserEvent extends Listener<typeof Events.GuildDelete> {
	public override async run(guild: Guild) {
		try {
			await GuildService.deleteGuild(guild.id);
			this.container.logger.info(`📤 Bot left guild: ${guild.name} (${guild.id})`);
		} catch (error) {
			this.container.logger.error('Error handling guild leave:', error);
		}
	}
}
