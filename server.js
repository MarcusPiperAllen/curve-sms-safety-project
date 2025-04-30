// server.js

// 1. Load environment variables for API keys
require('dotenv').config();

// 2. Verify that our broadcast key was loaded
console.log('API key length:', process.env.BROADCAST_API_KEY?.length);

const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;
const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const app = express();

// 3. Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// 4. In-memory subscriber store (later: move to Firestore)
const subscribers = new Set();

// 5. Helper: send a message to a list of phone numbers
async function broadcastSMS(phones, message) {
  const results = [];

  for (const phone of phones) {
    try {
      const sent = await twilioClient.messages.create({
        to:   phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: message
      });
      console.log(`Sent to ${phone}, SID: ${sent.sid}`);
      results.push({ phone, status: 'sent', sid: sent.sid });
    } catch (err) {
      console.error(`Failed to send to ${phone}:`, err.message);
      results.push({ phone, status: 'failed', error: err.message });
    }
  }

  return results;
}

// 6. Webhook: handle incoming SMS messages
app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const from = req.body.From;
  let body = req.body.Body?.trim();

  if (!body) {
    twiml.message("Message cannot be empty. Reply YES to subscribe, REPORT <...> to report an issue, or STOP to unsubscribe.");
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
  }

  console.log(`Incoming SMS from ${from}: "${body}"`);
  body = body.toUpperCase();

  if (body === 'YES') {
    subscribers.add(from);
    twiml.message("You’re subscribed! Reply REPORT <your message> to report an issue, STOP to unsubscribe.");
  } else if (body.startsWith('REPORT ')) {
    const issue = body.slice(7);
    console.log(`New report from ${from}: ${issue}`);
    twiml.message("Got it! We’ve logged your report and will follow up shortly.");
  } else if (body === 'STOP') {
    subscribers.delete(from);
    twiml.message("You’ve been unsubscribed. Reply YES anytime to re-subscribe.");
  } else {
    twiml.message("Sorry, I didn't understand that. Reply YES to subscribe, REPORT <...> to report an issue, or STOP to unsubscribe.");
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

// 7. Health check endpoint
app.get('/', (_req, res) => res.send('SMS Safety Server is running.'));

// 8. Secure broadcast endpoint (requires correct API key)
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
  try {
    const results = await broadcastSMS(phoneList, message);
    return res.json({ success: true, results });
  } catch (err) {
    console.error('Broadcast failed:', err);
    return res.status(500).json({ error: 'Broadcast failed' });
  }
});

// 9. Global error handler
app.use((err, _req, res, _next) => {
  console.error("Server Error:", err);
  res.status(500).send("Internal Server Error");
});

// 10. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
