const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');

const auth = require('./routes/auth');
const events = require('./routes/events');
const registrations = require('./routes/registrations');
const sponsors = require('./routes/sponsors');
const checkin = require('./routes/checkin');
const admin = require('./routes/admin');
const ai = require('./routes/ai');
const analytics = require('./routes/analytics');
const earlyAccess = require('./routes/earlyAccess');

const app = express();

app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://athlion-frontend.vercel.app'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Establish (or reuse) the DB connection on every request.
// Critical for serverless: cold starts connect, warm instances skip.
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'ATHLiON Backend API is running...' });
});

app.use('/api/auth', auth);
app.use('/api/events', events);
app.use('/api/registrations', registrations);
app.use('/api/admin', admin);
app.use('/api/sponsors', sponsors);
app.use('/api/checkin', checkin);
app.use('/api/ai', ai);
app.use('/api/analytics', analytics);
app.use('/api/early-access', earlyAccess);

// Alias routes for frontend compatibility
app.use('/auth', auth);
app.use('/events', events);
app.use('/registrations', registrations);
app.use('/admin', admin);
app.use('/sponsors', sponsors);
app.use('/checkin', checkin);
app.use('/ai', ai);
app.use('/analytics', analytics);
app.use('/early-access', earlyAccess);

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
