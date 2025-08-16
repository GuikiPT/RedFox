import './lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { initializeDatabase, closeDatabase, GuildService } from './database';

const client = new SapphireClient({
	caseInsensitiveCommands: true,
	defaultPrefix: 'rf!',
	fetchPrefix: async (message) => {
		if (!message.guild) return 'rf!';
		try {
			const customPrefix = await GuildService.getGuildPrefix(message.guild.id);
			return customPrefix || 'rf!';
		} catch (error) {
			console.error('Error fetching prefix:', error);
			return 'rf!';
		}
	},
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent
	],
	loadMessageCommandListeners: true,
	logger: {
		level: LogLevel.Debug
	}
});

const main = async () => {
	try {
		client.logger.info('Initializing database...');
		await initializeDatabase(client);
		
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		await closeDatabase(client);
		process.exit(1);
	}
};

process.on('SIGINT', async () => {
	client.logger.info('Received SIGINT, shutting down gracefully...');
	await client.destroy();
	await closeDatabase(client);
	process.exit(0);
});

process.on('SIGTERM', async () => {
	client.logger.info('Received SIGTERM, shutting down gracefully...');
	await client.destroy();
	await closeDatabase(client);
	process.exit(0);
});

void main();