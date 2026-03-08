const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendWhatsAppMessage = async (to, body) => {
    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            body: body,
        });
        console.log(`WhatsApp message sent: ${message.sid}`);
        return message;
    } catch (error) {
        console.error(`Twilio Error: ${error.message}`);
        throw error;
    }
};

module.exports = sendWhatsAppMessage;
