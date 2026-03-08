const mongoose = require('mongoose');
// mongoose connection

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Failed: ${error.message}`);
        // Do not exit process, let the server start for debugging
    }
};

module.exports = connectDB;
