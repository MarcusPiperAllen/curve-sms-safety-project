# CurveLink

## Overview
A smart community notification platform built with Node.js and Express that allows building management to broadcast emergency notifications and safety alerts to subscribed residents via Twilio SMS.

## Project Structure
- `server.js` - Main Express server with API endpoints
- `db.js` - PostgreSQL database layer using pg pool
- `twilio-tools.js` - Twilio SMS sending utilities
- `index.html` - Public subscription landing page (modern startup design with Inter font)
- `report.html` - Resident report submission page (dark mode, lightning bolt theme)
- `report.js` - Report page frontend logic with subscriber verification
- `admin.html` - Admin dashboard for managing alerts
- `admin.js` - Admin dashboard frontend logic
- `admin.css` - Admin dashboard styles
- `setup.sql` - Database schema for PostgreSQL

## Key Features
- SMS subscription management (START/STOP commands)
- Auto-Welcome SMS sent on subscription with report page link
- Issue reporting via SMS (REPORT command saves to database)
- Web-based report submission (verified subscribers only)
- Broadcast alerts to all subscribers
- Admin dashboard for viewing subscribers and message history
- Twilio webhook integration for incoming/outgoing SMS

## Configuration
The following environment variables are required for full functionality:

### Required Secrets (add via Secrets tab)
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number
- `BROADCAST_API_KEY` - API key for broadcast endpoint authentication
- `ADMIN_PASSWORD` - Password required to authorize broadcasts and dismiss reports

### Automatically Configured
- `DATABASE_URL` - PostgreSQL connection string (provided by Replit)

## Development
- Server runs on port 5000
- Database: PostgreSQL with tables for subscribers, messages, message_recipients, and reports
- Run with: `npm start`
- Sandbox Mode: Set `NODE_ENV=development` to log SMS to console instead of sending real texts

## API Endpoints
- `POST /sms` - Twilio webhook for incoming SMS
- `POST /broadcast` - Send alert to all subscribers (requires x-api-key header)
- `POST /admin/broadcast` - Password-protected broadcast from admin UI
- `POST /reports/:id/dismiss` - Password-protected dismiss report
- `POST /api/subscribe` - Public subscription endpoint (sends welcome SMS)
- `POST /api/report` - Verified subscriber report submission
- `GET /subscribers` - List all active subscribers
- `GET /alerts` - List all sent alerts
- `GET /reports` - List all resident-reported issues
- `GET /admin` - Admin Command Center
- `GET /report.html` - Resident report submission page

## Recent Changes
- January 24, 2026: Added Auto-Welcome SMS on subscription with report page URL
- January 24, 2026: Created report.html/report.js - web-based report submission for verified subscribers
- January 24, 2026: Added /api/report endpoint with subscriber verification
- January 24, 2026: Added "Report an issue" link to landing page footer
- January 24, 2026: Fixed Safety Inbox button responsiveness with proper event listeners
- January 17, 2026: Built Admin Command Center with dark mode UI, Safety Inbox, password-protected broadcasts
- January 17, 2026: Redesigned landing page with dark mode aesthetic, green accent color, Inter font
- January 17, 2026: Implemented REPORT SMS feature - residents can text "REPORT [issue]" to log issues to database
- January 17, 2026: Initial Replit setup, configured for port 5000, PostgreSQL database initialized
