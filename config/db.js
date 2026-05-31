// Database configuration, normalized into a single shape whether it comes from
// a DATABASE_URL connection string (as Coolify provides) or discrete DB_* vars.
function parse() {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            port: parseInt(url.port || '3306', 10),
            username: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ''),
            ssl: process.env.DB_SSL === 'true',
        };
    }

    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'stickynotes',
        ssl: process.env.DB_SSL === 'true',
    };
}

const db = { data: parse() };

module.exports = db;
