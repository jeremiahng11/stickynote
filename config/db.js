// Database configuration sourced from environment variables.
// In Coolify, attach a MySQL/MariaDB resource and map its credentials here.
const db = {
    data: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'stickynotes',
    },
};

module.exports = db;
