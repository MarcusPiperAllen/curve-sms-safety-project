# CurveLink

## Overview
A smart community notification platform built with Node.js and Express that allows building management to broadcast emergency notifications and safety alerts to subscribed residents via Twilio SMS.

## Project Structure
- `server.js` - Main Express server with API endpoints
- `db.js` - PostgreSQL database layer using pg pool
- `twilio-tools.js` - Twilio SMS sending utilities
- `index.html` - Public subscription landing page
- `admin.html` - Admin dashboard for managing alerts
- `admin.js` - Admin dashboard frontend logic
- `admin.css` - Admin dashboard styles

## Key Features
- SMS subscription management (START/STOP commands)
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

### Automatically Configured
- `DATABASE_URL` - PostgreSQL connection string (provided by Replit)

## Development
- Server runs on port 5000
- Database: PostgreSQL with tables for subscribers, messages, and message_recipients
- Run with: `npm start`

## API Endpoints
- `POST /sms` - Twilio webhook for incoming SMS
- `POST /broadcast` - Send alert to all subscribers (requires x-api-key header)
- `POST /api/subscribe` - Public subscription endpoint
- `GET /subscribers` - List all active subscribers
- `GET /alerts` - List all sent alerts
- `GET /admin` - Admin dashboard

## Recent Changes
- January 17, 2026: Initial Replit setup, configured for port 5000, PostgreSQL database initialized
