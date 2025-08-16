import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

export class UserEvent extends Listener<typeof Events.ClientReady> {
	public override run() {
		const { client } = this.container;
		
		this.container.logger.info(`🦊 ${client.user?.username} is ready!`);
		this.container.logger.info(`📊 Serving ${client.guilds.cache.size} guilds with ${client.users.cache.size} users`);
		
		// Set bot status
		client.user?.setPresence({
			status: 'online',
			activities: [{
				name: 'with Discord.js | rf!help',
				type: 0 // PLAYING
			}]
		});
	}
}
