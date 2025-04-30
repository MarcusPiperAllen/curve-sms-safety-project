// server.js
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Simple in-memory store (we'll swap for Firestore later)
const subscribers = new Set();

// Twilio will POST here on every incoming SMS
app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const from  = req.body.From;
  const body  = req.body.Body.trim().toUpperCase();

  if (body === 'YES') {
    subscribers.add(from);
    twiml.message("✅ You’re subscribed! Reply REPORT <your message> to report an issue, STOP to unsubscribe.");
  }
  else if (body.startsWith('REPORT ')) {
    const issue = req.body.Body.slice(7);
    // TODO: save { from, issue, timestamp } to Firestore
    console.log(`New report from ${from}: ${issue}`);
    twiml.message("👍 Got it! We’ve logged your report and will follow up shortly.");
  }
  else if (body === 'STOP') {
    subscribers.delete(from);
    twiml.message("You’ve been unsubscribed. Reply YES anytime to re-subscribe.");
  }
  else {
    twiml.message("Sorry, I didn't understand that. Reply YES to subscribe, REPORT <...> to report an issue, or STOP to unsubscribe.");
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

// Health check
app.get('/', (req, res) => res.send('SMS Safety Server is running.'));

// Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
