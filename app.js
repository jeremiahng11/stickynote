require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise');
const MySQLStore = require('express-mysql-session')(session);

const con = require('./models/connection');
const dbConfig = require('./config/db').data;
const userRouter = require('./routes/users');
const stickyRouter = require('./routes/sticky_board');

// Ensure models are registered (and associations defined) before syncing.
require('./models/users');
require('./models/notes');
require('./models/sticky_board');

const app = express();

const port = parseInt(process.env.PORT || '3005', 10);
const hostname = process.env.HOST || '0.0.0.0';

// Changes every deploy/restart; appended to static asset URLs so a new build
// busts any browser/Cloudflare cache instead of serving stale JS/CSS.
const ASSET_VERSION = Date.now().toString();

// set views engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// expose the asset version to all views
app.use(function (req, res, next) {
    res.locals.assetVersion = ASSET_VERSION;
    next();
});

// trust the reverse proxy in front of the app (Coolify / Traefik)
app.set('trust proxy', 1);

// body parsers (built into Express, body-parser no longer needed)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// static assets
app.use(express.static(path.join(__dirname, 'public')));

// Persist sessions in MySQL so they survive restarts / redeploys.
// We build the mysql2 pool ourselves and pass it in, because
// express-mysql-session's option whitelist drops `ssl` — which would break
// against a server that enforces require_secure_transport.
const sessionPool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    ...(dbConfig.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
});

const sessionStore = new MySQLStore({ createDatabaseTable: true }, sessionPool);
sessionStore.on('error', (err) => {
    console.error('Session store error:', err.message);
});

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'stickyNotes123#',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.COOKIE_SECURE === 'true',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
);

// CORS headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With,content-type,enctype,Authorization'
    );
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// health check endpoint for Coolify / load balancers
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/', userRouter);
app.use('/stickyBoard', stickyRouter);

// Surface the real error in logs instead of a bare "Internal Server Error".
app.use(function (err, req, res, next) {
    console.error('Unhandled error:', err.stack || err);
    if (res.headersSent) return next(err);
    res.status(500).send('Internal Server Error');
});

// Add the width/height columns to an existing sn_notes table if missing.
// sync() only creates missing tables, not missing columns, so we do it safely
// here (idempotent, leaves foreign keys untouched).
async function ensureNoteSizeColumns() {
    const { STRING } = require('sequelize');
    const qi = con.getQueryInterface();
    try {
        const desc = await qi.describeTable('sn_notes');
        if (!desc.width) {
            await qi.addColumn('sn_notes', 'width', { type: STRING, allowNull: true });
        }
        if (!desc.height) {
            await qi.addColumn('sn_notes', 'height', { type: STRING, allowNull: true });
        }
    } catch (err) {
        console.log('Could not ensure note size columns: ' + err.message);
    }
}

async function start() {
    try {
        await con.connectWithRetry();
        await con.sync();
        await ensureNoteSizeColumns();
        console.log('Database synced');

        app.listen(port, hostname, function () {
            console.log(`Server started on http://${hostname}:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
