import { SapphireClient } from '@sapphire/framework';
import { Sequelize } from 'sequelize';

const dbConfig = {
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '5432', 10),
	username: process.env.DB_USERNAME || 'redfox',
	password: process.env.DB_PASSWORD || 'enTInsasENEScenU',
	database: process.env.DB_NAME || 'redfox',
	dialect: 'postgres' as const,
	logging: false
};

export const sequelize = new Sequelize(
	dbConfig.database,
	dbConfig.username,
	dbConfig.password,
	{
		host: dbConfig.host,
		port: dbConfig.port,
		dialect: dbConfig.dialect,
		logging: dbConfig.logging
	}
);

export async function initializeDatabase(client: SapphireClient): Promise<void> {
	try {
		await sequelize.authenticate();
		client.logger.info('Database connection has been established successfully.');

		await sequelize.sync({ alter: true });
		client.logger.info('Database tables have been synchronized.');
	} catch (error) {
		client.logger.error('Unable to connect to the database:', error);
		throw error;
	}
}

export async function closeDatabase(client: SapphireClient): Promise<void> {
	try {
		await sequelize.close();
		client.logger.info('Database connection has been closed.');
	} catch (error) {
		client.logger.error('Error closing database connection:', error);
		throw error;
	}
}