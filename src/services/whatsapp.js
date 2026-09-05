const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

const sendWhatsAppMessage = async (to, body) => {
    try {
        if (!client) {
            console.log(`[Simulated WhatsApp] To: ${to} | Body: ${body}`);
            return { sid: 'simulated_wa_' + Date.now() };
        }
        const formattedTo = to.startsWith('+') ? to : `+91${to}`;
        const message = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
            to: `whatsapp:${formattedTo}`,
            body: body,
        });
        console.log(`WhatsApp message sent: ${message.sid}`);
        return message;
    } catch (error) {
        console.error(`Twilio WhatsApp Error: ${error.message}`);
        return { error: error.message };
    }
};

const sendSMSMessage = async (to, body) => {
    try {
        if (!client) {
            console.log(`[Simulated SMS] To: ${to} | Body: ${body}`);
            return { sid: 'simulated_sms_' + Date.now() };
        }
        const formattedTo = to.startsWith('+') ? to : `+91${to}`;
        const message = await client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
            to: formattedTo,
            body: body,
        });
        console.log(`SMS message sent: ${message.sid}`);
        return message;
    } catch (error) {
        console.error(`Twilio SMS Error: ${error.message}`);
        return { error: error.message };
    }
};

module.exports = { sendWhatsAppMessage, sendSMSMessage };
