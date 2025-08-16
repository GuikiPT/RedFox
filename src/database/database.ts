import { Sequelize } from 'sequelize';

// Database configuration
const dbConfig = {
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '5432', 10),
	username: process.env.DB_USERNAME || 'redfox',
	password: process.env.DB_PASSWORD || 'enTInsasENEScenU',
	database: process.env.DB_NAME || 'redfox',
	dialect: 'postgres' as const,
	logging: false
};

// Create Sequelize instance
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

// Database initialization function
export async function initializeDatabase(): Promise<void> {
	try {
		// Test the connection
		await sequelize.authenticate();
		console.log('Database connection has been established successfully.');

		// Sync all models
		await sequelize.sync({ alter: true });
		console.log('Database tables have been synchronized.');
	} catch (error) {
		console.error('Unable to connect to the database:', error);
		throw error;
	}
}

// Database cleanup function
export async function closeDatabase(): Promise<void> {
	try {
		await sequelize.close();
		console.log('Database connection has been closed.');
	} catch (error) {
		console.error('Error closing database connection:', error);
		throw error;
	}
}