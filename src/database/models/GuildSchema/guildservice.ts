import { Guild } from './guildschema';

export class GuildService {
	/**
	 * Get or create a guild record
	 */
	static async getOrCreateGuild(guildId: string, defaultPrefix: string = 'rf!'): Promise<Guild> {
		const [guild, created] = await Guild.findOrCreate({
			where: { guildId },
			defaults: {
				guildId,
				prefix: defaultPrefix
			}
		});

		if (created) {
			console.log(`Created new guild record for ${guildId}`);
		}

		return guild;
	}

	/**
	 * Get guild prefix
	 */
	static async getGuildPrefix(guildId: string): Promise<string | null> {
		const guild = await Guild.findOne({
			where: { guildId }
		});

		return guild ? guild.prefix : null;
	}

	/**
	 * Update guild prefix
	 */
	static async updateGuildPrefix(guildId: string, newPrefix: string): Promise<Guild> {
		const guild = await this.getOrCreateGuild(guildId);
		guild.prefix = newPrefix;
		await guild.save();
		
		console.log(`Updated prefix for guild ${guildId} to: ${newPrefix}`);
		return guild;
	}

	/**
	 * Delete guild record
	 */
	static async deleteGuild(guildId: string): Promise<boolean> {
		const deletedCount = await Guild.destroy({
			where: { guildId }
		});

		const deleted = deletedCount > 0;
		if (deleted) {
			console.log(`Deleted guild record for ${guildId}`);
		}

		return deleted;
	}

	/**
	 * Get all guilds
	 */
	static async getAllGuilds(): Promise<Guild[]> {
		return Guild.findAll();
	}

	/**
	 * Check if guild exists
	 */
	static async guildExists(guildId: string): Promise<boolean> {
		const guild = await Guild.findOne({
			where: { guildId }
		});
		return guild !== null;
	}
}

export default GuildService;