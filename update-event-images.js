const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Event = require('./src/models/Event');

async function updateEvents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Event.updateMany(
            {}, 
            { $set: { image: '/images/current-event.jpg' } }
        );

        console.log(`Updated ${result.modifiedCount} events.`);
        process.exit(0);
    } catch (err) {
        console.error('Error updating events:', err);
        process.exit(1);
    }
}

updateEvents();
