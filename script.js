require('dotenv').config();

const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.messages
  .create({
    body: 'Hello from Twilio!',
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.TARGET_PHONE_NUMBER
  })
  .then(msg => console.log('✅ Test SMS sent, SID:', msg.sid))
  .catch(err => console.error('❌ Twilio error:', err));

