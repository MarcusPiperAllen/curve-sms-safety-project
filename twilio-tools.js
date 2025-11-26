// 1) Load environment variables
require('dotenv').config();

// Helper function for timestamped logs
const now = () => new Date().toISOString();

// 2) Create the Twilio client
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send a welcome SMS to a given phone number.
 * @param {string} phone - E.164 format (e.g. "+1234567890")
 * @returns {Promise<object>} - resolves with the sent message object
 */
async function sendWelcomeSMS(phone) {
  try {
    const msg = await client.messages.create({
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: 'Curve Community Alerts: You are now subscribed to receive building updates. Reply STOP to cancel, HELP for help.'
    });
    console.log(`[${now()}] ✅ Welcome SMS sent: ${msg.sid}`);
    return msg;
  } catch (err) {
    console.error(`[${now()}] ❌ Welcome SMS error (${phone}): ${err.message}`);
    throw err;
  }
}

/**
 * Broadcast a message to multiple phone numbers.
 * @param {string[]} phones - Array of E.164 formatted numbers
 * @param {string} message - Text to send
 * @returns {Promise<object[]>} - Array of results including phone, SID/status, or error
 */
async function broadcastSMS(phones, message) {
  const results = [];
  const statusCallback = process.env.STATUS_CALLBACK_URL || null;

  for (let to of phones) {
    try {
      const msgOptions = {
        to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: message
      };

      // Add status callback if configured
      if (statusCallback) {
        msgOptions.statusCallback = statusCallback;
      }

      const msg = await client.messages.create(msgOptions);
      console.log(`[${now()}] ✅ Sent to ${to}, SID: ${msg.sid}`);
      results.push({ to, sid: msg.sid, status: 'sent' });
    } catch (err) {
      console.error(`[${now()}] ❌ Failed to ${to}: ${err.message}`);

      // Retry logic with a 1-second delay
      await new Promise(r => setTimeout(r, 1000));
      try {
        const msgOptions = {
          to,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: message
        };

        if (statusCallback) {
          msgOptions.statusCallback = statusCallback;
        }

        const retryMsg = await client.messages.create(msgOptions);
        console.log(`[${now()}] 🔁 Retry successful: ${to}, SID: ${retryMsg.sid}`);
        results.push({ to, sid: retryMsg.sid, status: 'sent (retry)' });
      } catch (retryErr) {
        console.error(`[${now()}] ❌ Final failure for ${to}: ${retryErr.message}`);
        results.push({ to, error: retryErr.message, status: 'failed' });
      }
    }
  }

  return results;
}

// 3) Export functions for use in server.js or other modules
module.exports = {
  sendWelcomeSMS,
  broadcastSMS
};

// 4) CLI Execution - Only runs when executed directly
if (require.main === module) {
  const message = process.argv[2] || 'Curve Community Alerts: This is a test broadcast.';
  const testNumbers = [
    process.env.TARGET_PHONE_NUMBER,
    process.env.TEST_PHONE_NUMBER_2 // Configurable second test number
  ];

  console.log(`[${now()}] 🚀 Running CLI Broadcast...`);
  broadcastSMS(testNumbers, message)
    .then(res => console.log(`[${now()}] 📝 Broadcast results:`, res))
    .catch(err => console.error(`[${now()}] ❌ Broadcast error:`, err));
}