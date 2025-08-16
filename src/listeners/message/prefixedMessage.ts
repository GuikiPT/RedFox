import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { GuildService } from '../../database/models/guild';

export class UserEvent extends Listener<typeof Events.PrefixedMessage> {
	public override async run(message: Message, prefix: string) {
		// This listener runs when a prefixed message is detected
		// We can use this to ensure the guild exists in our database
		if (message.guild) {
			try {
				// Ensure the guild exists in our database with the current prefix
				await GuildService.getOrCreateGuild(message.guild.id, prefix);
			} catch (error) {
				console.error('Error ensuring guild exists in database:', error);
			}
		}
	}
}
