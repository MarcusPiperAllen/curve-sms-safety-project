// 1. Load environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const { sendWelcomeSMS, broadcastSMS } = require("./twilio-tools");

// 2. Initialize App & Middleware
const app = express();
app.use(cors({
    origin: "http://127.0.0.1:5500", // 🔹 Allow frontend requests
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

// 5. SMS Webhook (Handles Incoming Texts)
app.post("/sms", (req, res) => {
    const twiml = new MessagingResponse();
    const from = req.body.From;
    let body = req.body.Body?.trim().toUpperCase();

    if (!body) {
        twiml.message("Message cannot be empty. Reply YES to subscribe, REPORT <...>, or STOP.");
        return res.status(200).send(twiml.toString());
    }

    console.log(`Incoming SMS from ${from}: "${body}"`);

    if (body === "YES") {
        subscribers.add(from);
        twiml.message("You're subscribed. Reply REPORT <...> to report an issue.");
    } else if (body.startsWith("REPORT ")) {
        console.log(`Report from ${from}: ${body.slice(7)}`);
        twiml.message("Thanks, we received your report.");
    } else if (body === "STOP") {
        subscribers.delete(from);
        twiml.message("You've been unsubscribed.");
    } else {
        twiml.message("Reply YES to subscribe, REPORT <...>, or STOP.");
    }

    res.status(200).send(twiml.toString());
});

// 6. Secure Broadcast Endpoint
app.post("/broadcast", async (req, res) => {
    const apiKey = req.header("x-api-key");
    if (apiKey !== process.env.BROADCAST_API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Missing "message" field in JSON body' });
    }

    const phoneList = Array.from(subscribers);

    if (!phoneList.length) {
        return res.status(200).json({ success: false, message: "No subscribers available." });
    }

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

// 7. Subscribers & Alerts Endpoints for Frontend
app.get("/subscribers", (req, res) => {
    res.json({ subscribers: Array.from(subscribers).map(num => ({ phone: num, status: "Active" })) });
});

app.get("/alerts", (req, res) => {
    res.json([{ message: "Test Alert", timestamp: "2025-05-01 15:30", sent: 5, delivered: 4, failed: 1 }]);
});

// 8. Health Check Route
app.get("/", (_req, res) => res.send("✅ SMS Safety Server is running."));

// 9. Global Error Handler
app.use((err, _req, res, _next) => {
    console.error("🚨 Server Error:", err);
    res.status(500).send("Internal Server Error");
});

// 10. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));