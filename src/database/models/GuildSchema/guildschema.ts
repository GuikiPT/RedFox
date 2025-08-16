import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../database';

// Define the attributes for the Guild model
interface GuildAttributes {
	id: number;
	guildId: string;
	prefix: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Define the creation attributes (optional fields for creation)
interface GuildCreationAttributes extends Optional<GuildAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define the Guild model class
export class Guild extends Model<GuildAttributes, GuildCreationAttributes> {
	declare id: number;
	declare guildId: string;
	declare prefix: string;
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

// Initialize the Guild model
Guild.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		guildId: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			field: 'guild_id'
		},
		prefix: {
			type: DataTypes.STRING(5),
			allowNull: false,
			defaultValue: 'rf!'
		}
	},
	{
		sequelize,
		tableName: 'guilds',
		timestamps: true,
		underscored: true
	}
);

export default Guild;