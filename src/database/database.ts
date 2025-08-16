import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'redfox',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

export async function initializeDatabase(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

export async function closeDatabase(): Promise<void> {
    try {
        await sequelize.close();
        console.log('✅ Database connection closed successfully.');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
}

export { sequelize };
export default sequelize;
