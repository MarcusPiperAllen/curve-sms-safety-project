# SMS MVP Discovery – User Stories & Features
**Date:** 2025-04-28

## User Stories (Residents)

1. **Opt-In for Updates**  
   **As a resident**, I want to receive updates directly on my phone without downloading an app.  
   **Done When:**  
   - I reply “YES” (or submit a quick web form).  
   - I immediately get a “Welcome to Gables Alerts!” SMS.

2.
   2. **Instant Issue & Security Reporting**  
   **As a resident**, I want to report maintenance problems or suspicious activity via SMS so management can respond immediately.  
   **Done When:**  
   - I text “REPORT <issue or concern>” (e.g., “REPORT leaky faucet” or “REPORT unattended package”).  
   - The system logs my message with a timestamp.  
   - I receive a confirmation SMS (“Thanks—we’ve logged your report.”).
Why This Works
- Flexibility for Residents: Covers a variety of potential issues, ensuring residents feel supported regardless of the type of concern.
- Real-Time Responsiveness: Helps management act swiftly to address problems.
- Ease of Use: Streamlining the reporting process encourages residents to engage with the system.





*(Add any other resident flows here…)*

## User Stories (Management)

3. **One-Click Broadcast**  
   **As management**, I want to send a single SMS to all subscribers so urgent alerts go out immediately.  
   **Done When:**  
   - I call `/broadcast?msg=…` (or press “Send” in an admin UI).  
   - The specified message is delivered to every phone number in our subscriber list.

*(Add any other management flows here…)*

## Questions & Risks
- How will we handle **opt-out** (e.g., replies of “STOP”)?  
- What are **Twilio rate limits** on outbound SMS?  
- Do we need to **sanitize** incoming messages?


## Data Flow

1. **Opt-In**  
   1. **Opt-In**  
   Resident texts “YES” to a dedicated Twilio number → Twilio webhook triggers server function.  
   - Function validates the phone number → writes `{ phone, timestamp }` to Firestore.  
   - Function sends “Welcome” SMS via Twilio.
   - If validation fails → sends SMS: “We couldn’t process your request. Please check your number.”
-The test did work as of 1:40pm 4/29/24!

2. **Welcome SMS**  
   After storing, server invokes Twilio API → sends “Welcome” SMS.  

3. **Broadcast**  
   Management hits `/broadcast?msg=…` endpoint → server queries Firestore for all `phone` entries → loops through them with Twilio API.  
   - Logs success/failure for each phone number in Firestore.  
   - Sends confirmation summary to management: “50 messages sent.”

4. **Report Handling**  
   Resident texts “REPORT <text>” → incoming SMS webhook triggers server → logs `{ phone, text, timestamp }` in Firestore → emails maintenance (if configured).  
   - If error occurs → sends SMS: “Issue received but temporarily delayed for processing.”

5. **Opt-Out**  
   Resident texts “STOP” → server function removes that `phone` from Firestore and sends “You have been unsubscribed” SMS.  
   - Updates Firestore: `subscribed: false`.


## Tech Stack

- **Firebase Functions (Node.js)**  
  • Pro: Serverless, auto-scaling  
  • Con: Cold-start latency (mitigate with warm-up ping)

- **Firestore**  
  • Pro: Real-time data, simple queries  
  • Con: Can incur read costs (use aggregate doc)

- **Twilio**  
  • Pro: Reliable SMS API, webhooks  
  • Con: Trial rate-limits (budget for paid tier)

- **Postman (Admin UI)**  
  • Pro: No UI code needed, instant testing  
  • Con: Not user-friendly for non-technical management


## Community Outreach
- **r/learnjavascript**  
  - Joined & posted intro: https://www.reddit.com/r/learnjavascript/comments/…  
  - Asked about webhook security & Firestore cost best practices  



