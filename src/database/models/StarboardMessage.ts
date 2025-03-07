import { DataTypes, Model } from 'sequelize';
import sequelize from '../sequelize';

class StarboardMessage extends Model {
    declare guildId: string;
    declare originalMessageId: string;
    declare starboardMessageId: string;
}

StarboardMessage.init(
    {
        guildId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        originalMessageId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
        },
        starboardMessageId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'StarboardMessage',
    },
);

export default StarboardMessage;
