// 1. Load environment variables
require('dotenv').config();
const { sendWelcomeSMS, broadcastSMS } = require('./twilio-tools');



// 2. Log environment variable statuses
console.log('✅ .env loaded');
console.log('TWILIO_ACCOUNT_SID:', !!process.env.TWILIO_ACCOUNT_SID ? '✔️' : '❌ MISSING');
console.log('TWILIO_AUTH_TOKEN:', !!process.env.TWILIO_AUTH_TOKEN ? '✔️' : '❌ MISSING');
console.log('TWILIO_PHONE_NUMBER:', !!process.env.TWILIO_PHONE_NUMBER ? '✔️' : '❌ MISSING');
console.log('BROADCAST_API_KEY:', !!process.env.BROADCAST_API_KEY ? '✔️' : '❌ MISSING');

// 3. Throw early if Twilio config missing
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('🚨 Twilio credentials are not set in .env file!');
}

// 4. Dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;
const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 5. App setup
const app = express();
app.use(cors()); // Allows cross-origin access
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// 6. In-memory subscriber list
const subscribers = new Set();

// 7. Helper function to send SMS messages removed 5-1-25


// 8. SMS webhook (handles incoming texts)
app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const from = req.body.From;
  let body = req.body.Body?.trim();

  if (!body) {
    twiml.message("Message cannot be empty. Reply YES to subscribe, REPORT <...>, or STOP.");
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
  }

  console.log(`Incoming SMS from ${from}: "${body}"`);
  body = body.toUpperCase();

  if (body === 'YES') {
    subscribers.add(from);
    twiml.message("You're subscribed. Reply REPORT <...> to report an issue.");
  } else if (body.startsWith('REPORT ')) {
    const issue = body.slice(7);
    console.log(`Report from ${from}: ${issue}`);
    twiml.message("Thanks, we received your report.");
  } else if (body === 'STOP') {
    subscribers.delete(from);
    twiml.message("You've been unsubscribed.");
  } else {
    twiml.message("Sorry, we didn't understand. Reply YES, REPORT <...>, or STOP.");
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

// 9. Secure broadcast endpoint (your pasted code)
app.post('/broadcast', async (req, res) => {
  const apiKey = req.header('x-api-key');
  if (apiKey !== process.env.BROADCAST_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing "message" field in JSON body' });
  }

  const phoneList = Array.from(subscribers);
  
  if (phoneList.length === 0) {
    console.warn('No subscribers to send the broadcast to.');
    return res.status(200).json({ success: false, message: 'No subscribers available.' });
  }

  try {
    const results = await broadcastSMS(phoneList, message);
    return res.json({
      success: true,
      totalRecipients: phoneList.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    });
  } catch (err) {
    console.error('❌ Broadcast failed:', err.message || err);
    return res.status(500).json({ error: 'Broadcast failed', details: err.message || err });
  }
});

// 10. Health check route
app.get('/', (_req, res) => res.send('✅ SMS Safety Server is running.'));

// 11. Global error handler
app.use((err, _req, res, _next) => {
  console.error("🚨 Server Error:", err);
  res.status(500).send("Internal Server Error");
});

// 12. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
