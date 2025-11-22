## Phase 1 – Implementation Targets

Backend:
- Replace in-memory subscribers with a real database (SQLite for dev)
- Add endpoints:
  - GET /api/subscribers
  - POST /api/subscribe
  - POST /api/admin/send
  - GET /api/messages
  - POST /webhook/twilio-status
  - POST /webhook/twilio-inbound
- Add STOP/HELP/START handling

Frontend:
- Wire admin dashboard subscriber table to real data
- Wire alert history to real DB entries
- Make the opt-in page hit /api/subscribe

Compliance:
- Add Privacy Policy page
- Add Terms of Service page
- Add correct opt-in disclosure text

Twilio:
- Reconnect Twilio webhook using your next ngrok URL
- Add status callback handler
