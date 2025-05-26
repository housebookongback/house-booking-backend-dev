require('dotenv').config();
console.log("envvvvvvvvvvvvvvvvv",process.env.DATABASE_HOST)

// Export for application use
const appConfig = {
    port: process.env.PORT,
    database: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        name: process.env.DATABASE_NAME
    },
    jwtSecret: process.env.JWT_SECRET,
    appUrl: process.env.appUrl
};

// Export for Sequelize CLI
const sequelizeConfig = {
    development: {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        dialect: 'postgres',
        logging: false
    },
    test: {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        dialect: 'postgres',
        logging: false
    },
    production: {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        dialect: 'postgres',
        logging: false
    }
};

module.exports = process.env.NODE_ENV === 'sequelize-cli' ? sequelizeConfig : appConfig; 