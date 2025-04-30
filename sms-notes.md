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

- **Combined Test (20:38 UTC)**  
  1. ✅ Sent to +1…392 (SID: SM2741d796f096e6f93d1d99e277bf0c73)  
  2. ❌ +1…807 unverified (retry also failed)  
- **Welcome SMS** still succeeds: SMafbede264ca15609ccffcfda75f40c9a

**How the Admin Dashboard Fits In**
You as “Admin”
You (or property management) will log into this dashboard to:

See who’s subscribed (the “Subscriber List”).

Manually broadcast a one-off or scheduled message (the “New Alert” form).

Review past messages and their statuses (the “Alert History” logs).

Why You Need It:

Quick Visibility: Instantly know who’s opted in without digging through raw Firestore records.

Controlled Broadcasts: Send targeted alerts (e.g. “Water shut-off at building 3”) without writing curl commands.

Audit Trail: If someone asks “When did you send the last security alert?” you can show them your logs.

# Admin Dashboard Wireframe

### 1. Sidebar Navigation
- **Dashboard**  
- **Subscribers**  
- **Alerts**  
- **Settings**  

---

### 2. Subscribers View (Tab)

| Name           | Phone         | Date Opted-In      | Status      |
| -------------- | ------------- | ------------------ | ----------- |
| Marcus Piper   | +1 210-392-2392 | 2025-04-29 14:00Z | Subscribed  |
| Jane Doe       | +1 555-123-4567 | 2025-04-28 09:30Z | Unsubscribed|

- **Search** box (filter by name or phone)  
- **Refresh** button (re-pull latest from database)  
- **Export CSV** button  

---

### 3. Alerts View (Tab)

| Message Preview               | Timestamp         | Sent | Delivered | Failed |
| ----------------------------- | ----------------- | ---- | --------- | ------ |
| “Water off at Bldg 2…”        | 2025-04-29 15:20Z |  50  |    49     |   1    |
| “Pool closed for cleaning…”   | 2025-04-29 12:05Z |  50  |    50     |   0    |

- Rows are **clickable** to expand per-recipient details  
- **New Alert** button → opens modal/form  

---

### 4. New Alert Modal/Form

- **Textarea** for message  
- **Send Now** / **Schedule Later** toggle  
- **Date/Time picker** (when scheduling)  
- **Send** button  

---

### 5. Settings View (Tab)

- **API Keys** (rotate/regenerate)  
- **Webhook URL** (for incoming SMS)  
- **Branding** (SMS sender name)  
- **Rate-Limit Threshold**  
- **Webhook Event Logs**  

**Wireframe Write-Up**(4/30/25)
What you’ve done

Defined a Subscribers table showing exactly the fields your SMS backend collects.

Scoped out the Alerts view so you can visualize /broadcast results.

Outlined a modal for sending new alerts, matching your Express endpoint.

Added a Settings tab for all configuration around Twilio, webhooks, and limits.

