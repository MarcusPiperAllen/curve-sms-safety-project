# Daily Reflection (2025-04-29)

**Successes:**
- Opt-in flow now persists to Firestore.
- Welcome SMS and broadcastSMS both work end-to-end.
- Logs are timestamped and include retry logic.

**Stumbles:**
- Trial-account limitation: unverified numbers can’t receive SMS.
- Initial ngrok/localtunnel hiccups slowed testing.

**Top 3 Must-Dos for 2025-04-30:**
1. Verify a paid/secondary test number or upgrade the Twilio plan.  
2. Expose and secure `/broadcast` as a proper HTTP endpoint in `server.js`.  
3. Reach out to Damien with a summary and ask for feedback on webhook security.


**Date 2025/04/30
“I will build and secure my SMS system today.”