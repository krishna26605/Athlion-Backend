const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'admin@hyrox.com';
        const password = 'Password123!';

        // Delete if exists
        await User.deleteOne({ email });

        const user = await User.create({
            name: 'Admin User',
            email,
            password,
            phone: '9876543211',
            role: 'admin'
        });

        console.log(`✅ Admin created: ${email} / ${password}`);
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    } finally {
        await mongoose.connection.close();
    }
};

createAdmin();
