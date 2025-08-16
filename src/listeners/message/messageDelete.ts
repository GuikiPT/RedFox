import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message, PartialMessage } from 'discord.js';

export class UserEvent extends Listener<typeof Events.MessageDelete> {
	public override async run(message: Message | PartialMessage) {
		// Log message deletions for moderation purposes
		if (message.author?.bot) return; // Ignore bot messages
		
		this.container.logger.debug(`Message deleted in ${message.guild?.name || 'DM'}: "${message.content?.slice(0, 100)}..."`);
		
		// You could implement message logging to database here
		// or send to a moderation channel
	}
}
