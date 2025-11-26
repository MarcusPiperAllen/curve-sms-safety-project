# Curve Community Alerts - Deployment Guide

## Local Development Setup

### 1. Install PostgreSQL

**Windows:** Download from https://www.postgresql.org/download/windows/

**Mac:** `brew install postgresql`

### 2. Create Local Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE curve_sms;

# Connect to it
\c curve_sms

# Run schema (from project root)
\i setup.sql

# Exit
\q
```

### 3. Configure Environment Variables

Create or update `.env` file:

```env
# Database (local)
PGUSER=postgres
PGPASSWORD=your_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=curve_sms

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# App
BROADCAST_API_KEY=your_secret_key
PORT=3000

# Optional (for Twilio status callbacks)
STATUS_CALLBACK_URL=https://your-ngrok-url.ngrok.io/sms/status

# Optional (for production CORS)
# CORS_ORIGIN=https://your-domain.com
```

### 4. Install Dependencies & Run

```bash
npm install
node server.js
```

### 5. Test Routes

```bash
# Health check
curl http://localhost:3000/

# Subscribe
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15551234567"}'

# Get subscribers
curl http://localhost:3000/subscribers

# Get alerts
curl http://localhost:3000/alerts

# Broadcast (requires API key)
curl -X POST http://localhost:3000/broadcast \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_secret_key" \
  -d '{"message": "Test alert!"}'
```

---

## Render Deployment

### 1. Create Render Account

Sign up at https://render.com

### 2. Create PostgreSQL Database

1. Dashboard → New → PostgreSQL
2. Name: `curve-sms-db`
3. Region: Choose closest to your users
4. Plan: Free (or paid for production)
5. Click "Create Database"
6. Copy the **Internal Database URL** (starts with `postgres://`)

### 3. Initialize Database Schema

1. Go to your database in Render dashboard
2. Click "Connect" → "External Connection"
3. Use the connection string to connect via psql or pgAdmin
4. Run the contents of `setup.sql`

### 4. Create Web Service

1. Dashboard → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name:** `curve-sms-safety`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid)

### 5. Add Environment Variables

In Web Service → Environment:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (paste Internal Database URL from step 2) |
| `TWILIO_ACCOUNT_SID` | your_sid |
| `TWILIO_AUTH_TOKEN` | your_token |
| `TWILIO_PHONE_NUMBER` | +1xxxxxxxxxx |
| `BROADCAST_API_KEY` | your_secret_key |
| `CORS_ORIGIN` | https://curve-sms-safety.onrender.com |
| `STATUS_CALLBACK_URL` | https://curve-sms-safety.onrender.com/sms/status |

### 6. Deploy

Click "Create Web Service" - Render will:
1. Clone your repo
2. Run `npm install`
3. Run `npm start`
4. Provide URL like `https://curve-sms-safety.onrender.com`

### 7. Configure Twilio Webhooks

In Twilio Console → Phone Numbers → Your Number:

- **A]SMS comes in:** `https://curve-sms-safety.onrender.com/sms`
- **HTTP Method:** POST

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (Render) | PostgreSQL connection string |
| `PGUSER` | Yes (local) | PostgreSQL username |
| `PGPASSWORD` | Yes (local) | PostgreSQL password |
| `PGHOST` | Yes (local) | PostgreSQL host |
| `PGPORT` | Yes (local) | PostgreSQL port |
| `PGDATABASE` | Yes (local) | PostgreSQL database name |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Yes | Your Twilio phone number |
| `BROADCAST_API_KEY` | Yes | Secret key for broadcast endpoint |
| `PORT` | No | Server port (default: 3000) |
| `CORS_ORIGIN` | No | Allowed CORS origins (comma-separated) |
| `STATUS_CALLBACK_URL` | No | URL for Twilio delivery callbacks |

---

## Troubleshooting

### "PostgreSQL connection error"
- Check DATABASE_URL or PG* variables are correct
- Ensure database exists and tables are created
- For Render: use Internal Database URL, not External

### "Unauthorized: Invalid API Key"
- Set `BROADCAST_API_KEY` in environment
- Include `x-api-key` header in broadcast requests

### CORS errors in browser
- Add your frontend URL to `CORS_ORIGIN`
- For multiple origins: `CORS_ORIGIN=https://app.com,https://admin.app.com`

### Twilio not receiving messages
- Verify webhook URL is correct in Twilio Console
- Check Twilio Console → Monitor → Logs for errors
- Ensure server is publicly accessible (not localhost)
