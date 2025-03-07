import { DataTypes, Model } from 'sequelize';
import sequelize from '../sequelize';

export interface IStarboardAttributes {
    id?: number;
    channelId: string;
    emoji: string;
    serverId: string;
    reactionsToStar?: number;
}

export class StarboardModel
    extends Model<IStarboardAttributes>
    implements IStarboardAttributes
{
    public id?: number;
    public channelId!: string;
    public emoji!: string;
    public serverId!: string;
    public reactionsToStar!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

StarboardModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        channelId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        serverId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reactionsToStar: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    },
    {
        sequelize,
        tableName: 'starboard',
    },
);

export default StarboardModel;
