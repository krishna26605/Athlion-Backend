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

        const raceName = 'Athlion Winter Sprint 2026';
        const count = await Event.countDocuments({ name: raceName });
        if (count > 0) {
            console.log('Race already exists');
            process.exit(0);
        }

        const event = await Event.create({
            name: raceName,
            description: 'The premier winter sprint event for elite athletes.',
            venue: {
                address: 'Athlion Performance Center, Pune',
                googleMapsLink: 'https://goo.gl/maps/PuneVenue'
            },
            date: new Date('2026-12-20'),
            startTime: '07:00',
            batchSize: 12,
            gapBetweenBatches: 20,
            maxParticipants: 300,
            price: 3500,
            createdBy: admin._id,
            status: 'upcoming'
        });

        console.log('✅ Created race:', event.name);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createEvent();
