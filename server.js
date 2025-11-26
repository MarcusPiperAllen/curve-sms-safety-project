// 1. Load environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const path = require("path");
const { MessagingResponse } = require("twilio").twiml;
const { sendSMS, broadcastSMS } = require("./twilio-tools");
const {
  addSubscriber,
  getSubscribers,
  removeSubscriber,
  addMessage,
  linkMessageToRecipient,
  getMessages,
  updateRecipientStatus
} = require("./db");

// 2. Initialize App & Middleware
const app = express();
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ["http://127.0.0.1:5500", "http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// 3. Verify Environment Variables
["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "BROADCAST_API_KEY"].forEach(key => {
    console.log(`${key}:`, process.env[key] ? "✔️" : `❌ MISSING`);
});
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error("🚨 Twilio credentials are missing in .env file!");
}

// 4. Subscription Helpers
async function markUserSubscribed(phone) {
    await addSubscriber(phone);
    console.log(`✅ User subscribed: ${phone}`);
}

async function markUserOptedOut(phone) {
    await removeSubscriber(phone);
    console.log(`✅ User opted out: ${phone}`);
}

// 5. SMS Webhook (Handles Incoming Texts from Twilio)
app.post("/sms", async (req, res) => {
    const twiml = new MessagingResponse();
    const from = req.body.From;
    let body = req.body.Body?.trim().toUpperCase();

    try {
        if (!body) {
            twiml.message("Message cannot be empty. Reply START to subscribe, REPORT <...>, or STOP.");
        } else if (body === "START") {
            await markUserSubscribed(from);
            twiml.message("Curve Community Alerts: You're now subscribed. Reply STOP to opt out, HELP for help.");
            console.log(`User ${from} subscribed.`);
        } else if (body.startsWith("REPORT ")) {
            console.log(`Report from ${from}: ${body.slice(7)}`);
            twiml.message("Thanks, we received your report.");
        } else if (body === "STOP") {
            await markUserOptedOut(from);
            twiml.message("Curve Community Alerts: You've been unsubscribed. Text START to re-subscribe.");
            console.log(`User ${from} opted out.`);
        } else if (body === "HELP") {
            twiml.message("Curve Community Alerts: Reply STOP to unsubscribe. For emergencies, call 911. For help, contact your building management.");
            console.log(`User ${from} requested HELP.`);
        } else {
            twiml.message("Reply START to subscribe, REPORT <...>, HELP, or STOP.");
        }
    } catch (error) {
        console.error("❌ Error processing SMS:", error);
        twiml.message("There was an error processing your request. Please try again.");
    }

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
});

// 6. Secure Broadcast Endpoint with API Key Middleware
function verifyAPIKey(req, res, next) {
    if (req.header("x-api-key") !== process.env.BROADCAST_API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }
    next();
}

app.post("/broadcast", verifyAPIKey, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing "message" field in JSON body' });

    try {
        const subscribers = await getSubscribers();
        const phoneList = subscribers.map(sub => sub.phone);

        if (!phoneList.length) {
            return res.status(200).json({ success: false, message: "No subscribers available." });
        }

        // Record message in DB
        const { lastInsertRowid: messageId } = await addMessage(message);

        // Link recipients
        for (const phone of phoneList) {
            await linkMessageToRecipient(messageId, phone, "pending");
        }

        // Send SMS
        const results = await broadcastSMS(phoneList, message);

        // Update recipient status in DB based on results
        for (const r of results) {
            let status = "pending";
            if (r.status === "sent" || r.status === "sent (retry)") status = "sent";
            else if (r.status === "failed") status = "failed";
            await updateRecipientStatus(messageId, r.to, status);
        }

        res.json({
            success: true,
            messageId,
            recipientCount: phoneList.length,
            totalRecipients: phoneList.length,
            sent: results.filter(r => r.status === "sent" || r.status === "sent (retry)").length,
            failed: results.filter(r => r.status === "failed").length,
            results
        });
    } catch (err) {
        console.error("❌ Broadcast failed:", err.message || err);
        res.status(500).json({ error: "Broadcast failed", details: err.message || err });
    }
});

// 7. Twilio Status Callback Webhook
app.post("/sms/status", (req, res) => {
    const { MessageSid, MessageStatus, To, ErrorCode } = req.body;

    console.log(`📬 Status update: ${MessageSid} → ${MessageStatus} (${To})`);

    // Map Twilio status to our status
    let dbStatus = "pending";
    if (MessageStatus === "delivered") dbStatus = "delivered";
    else if (MessageStatus === "sent") dbStatus = "sent";
    else if (["failed", "undelivered"].includes(MessageStatus)) dbStatus = "failed";

    if (ErrorCode) {
        console.error(`❌ Delivery error for ${To}: ${ErrorCode}`);
    }

    res.sendStatus(200);
});

// 8. Subscribers & Alerts Endpoints for Frontend
app.get("/subscribers", async (req, res) => {
    try {
        const subscribers = await getSubscribers();
        res.json({ subscribers });
    } catch (err) {
        console.error("❌ Error fetching subscribers:", err);
        res.status(500).json({ error: "Failed to fetch subscribers" });
    }
});

app.get("/alerts", async (req, res) => {
    try {
        const messages = await getMessages();
        res.json({ messages });
    } catch (err) {
        console.error("❌ Error fetching alerts:", err);
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
});

// 9. Public opt-in endpoint
app.post("/api/subscribe", async (req, res) => {
    const { phone } = req.body;

    // Validate phone
    if (!phone || typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({ success: false, message: "Phone number is required." });
    }

    const normalizedPhone = phone.trim();

    try {
        await addSubscriber(normalizedPhone);
        console.log(`✅ New subscriber via web form: ${normalizedPhone}`);
        res.json({ success: true, message: "You're now subscribed to Curve Community Alerts!" });
    } catch (err) {
        console.error("❌ Subscription error:", err);
        res.status(500).json({ success: false, message: "Failed to subscribe. Please try again." });
    }
});

// 10. DEV ONLY - remove in production
app.post("/dev/subscribe", async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Missing phone" });

    try {
        await addSubscriber(phone);
        res.json({ success: true, phone });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Convenience route for admin dashboard
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

// 12. Health Check Route
app.get("/", (_req, res) => res.send("✅ Curve Community Alerts Server is running."));

// 13. Global Error Handler
app.use((err, _req, res, _next) => {
    console.error("🚨 Server Error:", err);
    res.status(500).send("Internal Server Error");
});

// 14. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
