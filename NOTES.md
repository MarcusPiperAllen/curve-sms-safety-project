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

Wins: (e.g.) “Normalized all line endings,” “Deployed admin.html prototype,” “Wired up filter & export.”

Stumbles: (e.g.) “ngrok hiccup,” “Appointment delayed Twilio upgrade,” etc.
**3 Must-Dos:**

Verify phone number or upgrade Twilio plan

Secure /broadcast with API key

Sketch Admin UI data bindings (Firestore → table)

## 📅 May 1, 2025

### ✅ What I Did Today
- Established 200 OK connection between Ngrok and local server
- Verified Twilio SMS delivery via live Admin UI
- Archived `curve-safety-project` as Phase 1 complete
- Posted a developer networking thread on Reddit (1 beginner response)
- Checked LinkedIn (no strong leads yet)
- Resumed FreeCodeCamp JavaScript lessons (conditions, loops)
- Started LLC planning in separate doc
- Reorganized dev folder structure and created
Logged job lead: GDIT Software Developer Associate
Server.js + twilio-tools.js now clean and modular
 `Archived_Dev_Projects`
- Sent a live message from the admin panel and confirmed in logs

---

### 🚧 Challenges or Blockers
- Haven’t heard from dev friend yet
- No strong job/internship leads today
- Need to resume consistent typing + GitHub push routine
- Parsons internship was declined
- Need to clear the 502 error 
---
- ✅ Final code pushed to GitHub (`curve-safety-project`)

### 🔭 What Comes Next
- Full school day Friday (assignments pending)
- Reach out to Reddit beginner for a short convo
- Search for 1 internship + update resume if needed
- Continue JavaScript drills and document new functions in `day1-notes.js`
- Begin GitHub README or portfolio page for Curve-Safety
- Begin prepping for possible LLC setup (not urgent, just planned)
 ## May 1 – Final Log## 

✅ Highlights:
- Admin UI is fully functional in structure
- Navigation buttons activate correct sections
- Secure Ngrok + Express backend runs cleanly
- API key removed from frontend
- All code committed and pushed to GitHub

🛠 Gaps:
- Message input modal only accessible via Alerts, not Dashboard
- No backend data store (subscribers & alerts not persisted)
- Twilio webhook still pointed to old Ngrok URL (update required)
- No dynamic data populates dashboard yet

🎯 Ready for Phase 2:
- Link Twilio to latest Ngrok
- Store subscriber/alert data dynamically
- Add message creation widget to Dashboard (or make Alerts default)
**Date May 5, 2025**
 “Must‑Do 3”
Apply to 3 targeted jobs.

Complete Java two exercises.

Outline your LLC steps & SMS service pitch.
**May 7, 2025**
"3 Must Do"
Apply to 3 internships or jobs
complete at least 2 javascript task
situate all code for sms app 
Log day at end of day
End‑of‑Day Log:

✅ Applied to the Junior Systems Engineer Intern position at American Systems

⬜ Didn’t get to JavaScript tasks today—will tackle those first thing tomorrow

✅ Organized and committed all SMS app code, pushed updates to GitHub, and deployed the opt‑in page to Netlify

📋 Plan for tomorrow:

Finish 2 JavaScript exercises

Test STOP/HELP flows end‑to‑end

Begin frontend validation enhancements
**Thursday, May 8, 2025**

3 Must‑Do Today

Apply to at least 2 more internships or jobs (follow up on yesterday’s applications and expand your reach).

Complete 2 JavaScript practice tasks—focus on array and object methods to sharpen your coding fluency.

Test your STOP/HELP SMS flows end‑to‑end and fix any edge‑case bugs in your /sms webhook.

