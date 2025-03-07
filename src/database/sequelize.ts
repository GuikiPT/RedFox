import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize;

try {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not defined');
    }

    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mariadb',
        logging: false,
    });

    sequelize
        .authenticate()
        .then(() => {
            console.log(
                'Database connection has been established successfully.',
            );
        })
        .catch((error) => {
            console.error(
                'Unable to connect to the database:',
                error instanceof Error ? error.stack : String(error),
            );
            console.error('Database connection is required. Shutting down.');
            process.exit(1);
        });
} catch (error) {
    console.error(
        'Error initializing Sequelize:',
        error instanceof Error ? error.message : error,
    );
    console.error('Failed to initialize database. Shutting down.');
    process.exit(1);
}

export default sequelize;
