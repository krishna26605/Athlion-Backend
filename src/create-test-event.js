const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('./models/Event');
const User = require('./models/User');

async function createEvent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('Admin user not found');
            process.exit(1);
        }

        const count = await Event.countDocuments({ name: 'Hyrox Mumbai 2026' });
        if (count > 0) {
            console.log('Event already exists');
            process.exit(0);
        }

        const event = await Event.create({
            name: 'Hyrox Mumbai 2026',
            description: 'The Fitness Race for Every Body. Join the global fitness series now in Mumbai!',
            venue: {
                address: 'Jio World Convention Centre, Bandra Kurla Complex, Mumbai',
                googleMapsLink: 'https://goo.gl/maps/MumbaiVenue'
            },
            date: new Date('2026-11-15'),
            startTime: '06:00',
            batchSize: 10,
            gapBetweenBatches: 15,
            maxParticipants: 500,
            price: 4500,
            createdBy: admin._id,
            status: 'upcoming'
        });

        console.log('✅ Created event:', event.name);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createEvent();
