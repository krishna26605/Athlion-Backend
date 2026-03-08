const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const promoteToAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOneAndUpdate(
            { email },
            { role: 'admin' },
            { new: true }
        );
        if (user) {
            console.log(`✅ User ${email} promoted to admin successfully!`);
            console.log(user);
        } else {
            console.log(`❌ User with email ${email} not found.`);
        }
    } catch (err) {
        console.error(`❌ Error promoting user: ${err.message}`);
    } finally {
        await mongoose.connection.close();
    }
};

const email = process.argv[2];
if (!email) {
    console.log('Please provide an email address as an argument.');
    console.log('Usage: node promote-admin.js user@example.com');
} else {
    promoteToAdmin(email);
}
