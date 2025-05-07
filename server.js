// 1. Load environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const { MessagingResponse } = require("twilio").twiml;
const { sendSMS, broadcastSMS } = require("./src/messaging/twilio");

// 2. Initialize App & Middleware
const app = express();
app.use(helmet()); // ✅ Security headers added
app.use(cors({
    origin: "http://127.0.0.1:5500", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// 3. Verify Environment Variables
["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "BROADCAST_API_KEY"].forEach(key => {
    console.log(`${key}:`, process.env[key] ? "✔️" : `❌ MISSING`);
});
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error("🚨 Twilio credentials are missing in .env file!");
}

// 4. In-Memory Subscriber List (Replace with DB Later)
const subscribers = new Set();

// 5. Subscription Helpers
async function markUserSubscribed(phone) {
    subscribers.add(phone);
    console.log(`✅ User subscribed: ${phone}`);
    // TODO: persist to DB
}

async function markUserOptedOut(phone) {
    subscribers.delete(phone);
    console.log(`✅ User opted out: ${phone}`);
    // TODO: persist to DB
}

// 6. SMS Webhook (Handles Incoming Texts)
app.post("/sms", async (req, res) => {
    const twiml = new MessagingResponse();
    const from = req.body.From;
    let body = req.body.Body?.trim().toUpperCase();

    try {
        if (!body) {
            twiml.message("Message cannot be empty. Reply START to subscribe, REPORT <...>, or STOP.");
        } else if (body === "START") {
            await markUserSubscribed(from);
            twiml.message("CURVE Safety: You’re now subscribed. Reply STOP to opt‑out.");
            console.log(`User ${from} subscribed.`);
        } else if (body.startsWith("REPORT ")) {
            console.log(`Report from ${from}: ${body.slice(7)}`);
            twiml.message("Thanks, we received your report.");
        } else if (body === "STOP") {
            await markUserOptedOut(from);
            twiml.message("CURVE Safety: You’ve been unsubscribed from alerts. Text START to re‑subscribe.");
            console.log(`User ${from} opted out.`);
        } else if (body === "HELP") {
            twiml.message("CURVE Safety Assistance:\nReply STOP to unsubscribe.\nFor emergencies, call 911.\nFor assistance, contact [support@email.com].");
            console.log(`User ${from} requested HELP.`);
        } else {
            twiml.message("Reply START to subscribe, REPORT <...>, HELP, or STOP.");
        }
    } catch (error) {
        console.error("❌ Error processing SMS:", error);
        twiml.message("There was an error processing your request. Please try again.");
    }

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());  // ✅ Centralized response handling
    return;
});

// 7. Secure Broadcast Endpoint with API Key Middleware
function verifyAPIKey(req, res, next) {
    if (req.header("x-api-key") !== process.env.BROADCAST_API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }
    next();
}

app.post("/broadcast", verifyAPIKey, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing "message" field in JSON body' });

    const phoneList = Array.from(subscribers);
    if (!phoneList.length) return res.status(200).json({ success: false, message: "No subscribers available." });

    try {
        const results = await broadcastSMS(phoneList, message);
        res.json({
            success: true,
            totalRecipients: phoneList.length,
            sent: results.filter(r => r.status === "sent").length,
            failed: results.filter(r => r.status === "failed").length,
            results
        });
    } catch (err) {
        console.error("❌ Broadcast failed:", err.message || err);
        res.status(500).json({ error: "Broadcast failed", details: err.message || err });
    }
});

// 8. Subscribers & Alerts Endpoints for Frontend
app.get("/subscribers", (req, res) => {
    res.json({ subscribers: Array.from(subscribers).map(num => ({ phone: num, status: "Active" })) });
});

app.get("/alerts", (req, res) => {
    res.json([{ message: "Test Alert", timestamp: "2025-05-01 15:30", sent: 5, delivered: 4, failed: 1 }]);
});

// 9. Health Check Route
app.get("/", (_req, res) => res.send("✅ SMS Safety Server is running."));

// 10. Global Error Handler
app.use((err, _req, res, _next) => {
    console.error("🚨 Server Error:", err);
    res.status(500).send("Internal Server Error");
});

// 11. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));