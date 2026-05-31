require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const con = require('./models/connection');
const userRouter = require('./routes/users');
const stickyRouter = require('./routes/sticky_board');

// Ensure models are registered (and associations defined) before syncing.
require('./models/users');
require('./models/notes');
require('./models/sticky_board');

const app = express();

const port = parseInt(process.env.PORT || '3005', 10);
const hostname = process.env.HOST || '0.0.0.0';

// set views engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// trust the reverse proxy in front of the app (Coolify / Traefik)
app.set('trust proxy', 1);

// body parsers (built into Express, body-parser no longer needed)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// static assets
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'stickyNotes123#',
        resave: false,
        saveUninitialized: true,
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

async function start() {
    try {
        await con.connectWithRetry();
        await con.sync();
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
