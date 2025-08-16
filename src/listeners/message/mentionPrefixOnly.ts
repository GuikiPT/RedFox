import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { GuildService } from '../../database/models/guild';

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public override async run(message: Message) {
		// Do nothing if we cannot send messages in the channel (eg. group DMs)
		if (!message.channel.isSendable()) return;

		let prefix: string;
		
		if (message.guild) {
			// Get custom prefix from database for guilds
			prefix = await GuildService.getGuildPrefix(message.guild.id);
		} else {
			// Use default prefix for DMs
			const defaultPrefix = this.container.client.options.defaultPrefix;
			prefix = Array.isArray(defaultPrefix) ? defaultPrefix[0] : defaultPrefix || 'rf!';
		}

		return message.channel.send(`My prefix in this ${message.guild ? 'server' : 'DM'} is: \`${prefix}\``);
	}
}
