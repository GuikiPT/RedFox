import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { GuildService } from '../../database/models/guild';

export class UserEvent extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message) {
		if (message.author.bot) return;

		if (message.guild) {
			try {
				await GuildService.getOrCreateGuild(message.guild.id);
			} catch (error) {
				console.error('Error ensuring guild exists:', error);
			}
		}
	}
}
