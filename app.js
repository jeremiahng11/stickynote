require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');
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

// expose the asset version to all views and keep HTML pages uncached so they
// always reference the latest asset URLs (static files keep normal caching)
app.use(function (req, res, next) {
    res.locals.assetVersion = ASSET_VERSION;
    if (req.method === 'GET' && req.accepts('html') && !req.path.startsWith('/css') && !req.path.startsWith('/js') && !req.path.startsWith('/images')) {
        res.set('Cache-Control', 'no-store');
    }
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

// Warn loudly if the session secret is left at the insecure default in prod.
const SESSION_SECRET = process.env.SESSION_SECRET || 'stickyNotes123#';
if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET is not set — using an insecure default. Set it in production.');
}

app.use(
    session({
        secret: SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.COOKIE_SECURE === 'true',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
);

// (CORS headers removed — the frontend is served from the same origin, and the
//  previous `Allow-Origin: *` + `Allow-Credentials: true` combo was insecure.)

// Throttle auth attempts to slow down brute-force / credential stuffing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                  // 20 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: 'Too many attempts. Please try again later.' },
});

// health check endpoint for Coolify / load balancers
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// only throttle the POST actions, not the page loads
const limitPosts = (req, res, next) => (req.method === 'POST' ? authLimiter(req, res, next) : next());
app.use(['/login-register', '/forgot-password', '/reset-password'], limitPosts);
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

// Add the password-reset columns to an existing sn_users table if missing.
async function ensureUserResetColumns() {
    const { STRING, BIGINT } = require('sequelize');
    const qi = con.getQueryInterface();
    try {
        const desc = await qi.describeTable('sn_users');
        if (!desc.resetToken) {
            await qi.addColumn('sn_users', 'resetToken', { type: STRING, allowNull: true });
        }
        if (!desc.resetExpires) {
            await qi.addColumn('sn_users', 'resetExpires', { type: BIGINT, allowNull: true });
        }
    } catch (err) {
        console.log('Could not ensure user reset columns: ' + err.message);
    }
}

// Remove any corrupt notes with a non-positive primary key. Such a row would be
// read by the client as id=0 (a "new" note) and re-created on every save.
async function cleanupBadNotes() {
    try {
        const [result] = await con.query('DELETE FROM sn_notes WHERE id IS NULL OR id <= 0');
        const removed = (result && (result.affectedRows || 0)) || 0;
        if (removed) { console.log('Removed ' + removed + ' corrupt note row(s) with id <= 0'); }
    } catch (err) {
        console.log('Could not clean up bad notes: ' + err.message);
    }
}

// Collapse duplicate notes left over from the earlier id-reconciliation bug.
// Two notes that share the same board, text, position, size and colour are
// duplicates; keep the lowest id and delete the rest. Safe + idempotent
// (distinct notes never share an exact pixel position and identical text).
async function dedupeNotes() {
    try {
        const [result] = await con.query(
            'DELETE n1 FROM sn_notes n1 ' +
            'JOIN sn_notes n2 ON n1.boardId = n2.boardId ' +
            'AND n1.note <=> n2.note AND n1.xPos <=> n2.xPos AND n1.yPos <=> n2.yPos ' +
            'AND n1.width <=> n2.width AND n1.height <=> n2.height AND n1.color <=> n2.color ' +
            'AND n1.id > n2.id'
        );
        const removed = (result && (result.affectedRows || 0)) || 0;
        if (removed) { console.log('Removed ' + removed + ' duplicate note row(s)'); }
    } catch (err) {
        console.log('Could not dedupe notes: ' + err.message);
    }
}

async function start() {
    try {
        await con.connectWithRetry();
        await con.sync();
        await ensureNoteSizeColumns();
        await ensureUserResetColumns();
        await cleanupBadNotes();
        await dedupeNotes();
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
