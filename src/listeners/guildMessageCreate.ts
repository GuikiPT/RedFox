import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { GuildService } from '../database/models/guild';

export class UserEvent extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message) {
		// Skip if it's a bot message
		if (message.author.bot) return;

		// For guild messages, check if we need to update the prefix cache
		if (message.guild) {
			try {
				// Ensure guild exists in database
				await GuildService.getOrCreateGuild(message.guild.id);
			} catch (error) {
				console.error('Error ensuring guild exists:', error);
			}
		}
	}
}
