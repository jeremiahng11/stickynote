const { Sequelize } = require('sequelize');
const config = require('../config/db');

const db = config.data;

const dialectOptions = {
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
};

// Prefer a single connection URL (e.g. the one Coolify provides) when present;
// otherwise fall back to the discrete DB_* variables.
const con = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, dialectOptions)
    : new Sequelize(db.database, db.username, db.password, {
          host: db.host,
          port: db.port,
          ...dialectOptions,
      });

// Retry the initial connection so the app can start before the DB is ready
// (common in container orchestration like Coolify / docker-compose).
async function connectWithRetry(retries = 10, delayMs = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await con.authenticate();
            console.log('Database connection established');
            return;
        } catch (error) {
            console.log(
                `Database connection failed (attempt ${attempt}/${retries}): ${error.message}`
            );
            if (attempt === retries) throw error;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

con.connectWithRetry = connectWithRetry;

module.exports = con;
