import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

export interface GuildAttributes {
    id: string;
    custom_prefix: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GuildCreationAttributes extends Optional<GuildAttributes, 'createdAt' | 'updatedAt'> {}

export class Guild extends Model<GuildAttributes, GuildCreationAttributes> implements GuildAttributes {
    public id!: string;
    public custom_prefix!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public getPrefix(): string {
        return this.custom_prefix;
    }

    public async updatePrefix(newPrefix: string): Promise<void> {
        this.custom_prefix = newPrefix;
        await this.save();
    }
}

Guild.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            comment: 'Discord Guild ID'
        },
        custom_prefix: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'rf!',
            validate: {
                len: [1, 5],
                notEmpty: true
            },
            comment: 'Custom prefix for the guild'
        }
    },
    {
        sequelize,
        modelName: 'Guild',
        tableName: 'guilds',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['id']
            }
        ]
    }
);

export class GuildService {
    public static async findGuildById(guildId: string): Promise<Guild | null> {
        try {
            return await Guild.findByPk(guildId);
        } catch (error) {
            console.error('Error finding guild by ID:', error);
            throw error;
        }
    }

    public static async createGuild(guildData: GuildCreationAttributes): Promise<Guild> {
        try {
            return await Guild.create(guildData);
        } catch (error) {
            console.error('Error creating guild:', error);
            throw error;
        }
    }

    public static async getOrCreateGuild(guildId: string, customPrefix: string = 'rf!'): Promise<Guild> {
        try {
            const [guild, created] = await Guild.findOrCreate({
                where: { id: guildId },
                defaults: {
                    id: guildId,
                    custom_prefix: customPrefix
                }
            });

            if (created) {
                console.log(`📝 Created new guild record for ${guildId}`);
            }

            return guild;
        } catch (error) {
            console.error('Error getting or creating guild:', error);
            throw error;
        }
    }

    public static async updateGuildPrefix(guildId: string, newPrefix: string): Promise<Guild | null> {
        try {
            if (!newPrefix || newPrefix.length === 0) {
                throw new Error('Prefix cannot be empty');
            }
            
            if (newPrefix.length > 5) {
                throw new Error('Prefix cannot be longer than 5 characters');
            }

            const guild = await this.findGuildById(guildId);
            if (!guild) {
                return await this.createGuild({
                    id: guildId,
                    custom_prefix: newPrefix
                });
            }

            await guild.updatePrefix(newPrefix);
            console.log(`✅ Updated prefix for guild ${guildId} to "${newPrefix}"`);
            return guild;
        } catch (error) {
            console.error('Error updating guild prefix:', error);
            throw error;
        }
    }

    public static async getGuildPrefix(guildId: string): Promise<string> {
        try {
            const guild = await this.findGuildById(guildId);
            return guild ? guild.getPrefix() : 'rf!';
        } catch (error) {
            console.error('Error getting guild prefix:', error);
            return 'rf!';
        }
    }

    public static async deleteGuild(guildId: string): Promise<boolean> {
        try {
            const deletedCount = await Guild.destroy({
                where: { id: guildId }
            });
            
            const wasDeleted = deletedCount > 0;
            if (wasDeleted) {
                console.log(`🗑️ Deleted guild record for ${guildId}`);
            }
            
            return wasDeleted;
        } catch (error) {
            console.error('Error deleting guild:', error);
            throw error;
        }
    }

    public static async getAllGuilds(): Promise<Guild[]> {
        try {
            return await Guild.findAll();
        } catch (error) {
            console.error('Error getting all guilds:', error);
            throw error;
        }
    }

    public static async countGuilds(): Promise<number> {
        try {
            return await Guild.count();
        } catch (error) {
            console.error('Error counting guilds:', error);
            throw error;
        }
    }
}

export default Guild;
