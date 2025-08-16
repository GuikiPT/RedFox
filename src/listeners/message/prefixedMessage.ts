import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { GuildService } from '../../database/models/guild';

export class UserEvent extends Listener<typeof Events.PrefixedMessage> {
	public override async run(message: Message, prefix: string) {
		if (message.guild) {
			try {
				await GuildService.getOrCreateGuild(message.guild.id, prefix);
			} catch (error) {
				console.error('Error ensuring guild exists in database:', error);
			}
		}
	}
}
