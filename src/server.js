const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// Load environment variables immediately
require('dotenv').config();

const connectDB = require('./config/db');

const auth = require('./routes/auth');
const events = require('./routes/events');
const registrations = require('./routes/registrations');
const sponsors = require('./routes/sponsors');
const checkin = require('./routes/checkin');
const admin = require('./routes/admin');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'ATHLiON Backend API is running...' });
});

// Mount routes
app.use('/api/auth', auth);
app.use('/api/events', events);
app.use('/api/registrations', registrations);
app.use('/api/admin', admin);
app.use('/api/sponsors', sponsors);
app.use('/api/checkin', checkin);

// Error Handling Middleware (Base)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const startServer = async () => {
    // Connect to database
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();
