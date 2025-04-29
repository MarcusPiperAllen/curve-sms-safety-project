// 1) Load your .env
require('dotenv').config();

// Helper for timestamped logs
const now = () => new Date().toISOString();

// 2) Create the Twilio client
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send a welcome SMS to a given phone number.
 * @param {string} phone – E.164 format (e.g. "+1234567890")
 * @returns {Promise} – resolves with the sent message object
 */
function sendWelcomeSMS(phone) {
  return client.messages.create({
    to:   phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: '✅ Welcome to Gables Alerts! You’re now subscribed.'
  });
}

// 3) Test invocation (replace your old client.messages.create block)
if (require.main === module) {
  sendWelcomeSMS(process.env.TARGET_PHONE_NUMBER)
    .then(msg => console.log('✅ Welcome SMS sent, SID:', msg.sid))
    .catch(err => console.error('❌ sendWelcomeSMS error:', err));
}
/**
 * Broadcast a message to multiple phone numbers.
 * @param {string[]} phones – array of E.164 strings
 * @param {string} message – text to send
 * @returns {Promise<object[]>} – array of results with to/SID/status or error
 */
async function broadcastSMS(phones, message) {
  const results = [];
  for (let to of phones) {
    try {
      const msg = await client.messages.create({
        to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: message
      });
      // Timestamped success log
      console.log(`[${now()}] ✅ Sent to ${to}, SID: ${msg.sid}`);
      results.push({ to, sid: msg.sid, status: 'sent' });
    } catch (err) {
      // Timestamped error log
      console.error(`[${now()}] ❌ Failed to ${to}:`, err.message);

      // Optional: retry once after a 1s delay
      await new Promise(r => setTimeout(r, 1000));
      try {
        const retryMsg = await client.messages.create({
          to,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: message
        });
        console.log(`[${now()}] 🔁 Retry sent to ${to}, SID: ${retryMsg.sid}`);
        results.push({ to, sid: retryMsg.sid, status: 'sent (retry)' });
      } catch {
        // Final failure logged
        console.error(`[${now()}] ❌ Retry also failed for ${to}`);
        results.push({ to, error: err.message, status: 'failed' });
      }
    }
  }
  return results;
}



// If run directly, test with two numbers
if (require.main === module) {
  const testNumbers = [
    process.env.TARGET_PHONE_NUMBER,
    '+12109865807'
  ];
  broadcastSMS(testNumbers, '📢 Test broadcast from Gables Alerts!')
    .then(res => console.log('Broadcast results:', res))
    .catch(err => console.error('Broadcast error:', err));
}
