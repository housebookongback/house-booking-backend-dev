require('dotenv').config();

module.exports = {
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