import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../database';

interface GuildAttributes {
	id: number;
	guildId: string;
	prefix: string;
	createdAt?: Date;
	updatedAt?: Date;
}

interface GuildCreationAttributes extends Optional<GuildAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Guild extends Model<GuildAttributes, GuildCreationAttributes> {
	declare id: number;
	declare guildId: string;
	declare prefix: string;
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

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