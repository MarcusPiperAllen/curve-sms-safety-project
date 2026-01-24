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
  isSubscriber,
  addMessage,
  linkMessageToRecipient,
  getMessages,
  updateRecipientStatus,
  addReport,
  getReports,
  updateReportStatus
} = require("./db");

// 2. Initialize App & Middleware
const app = express();
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : [
            "https://curvelinx.netlify.app",
            "https://f50c3599-a652-4a6d-85e5-b28d4c6b6b42-00-2e9y10qe3rmg8.riker.replit.dev",
            "http://localhost:5000",
            "http://127.0.0.1:5000"
          ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// 3. Verify Environment Variables
["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "BROADCAST_API_KEY", "ADMIN_PASSWORD"].forEach(key => {
    console.log(`${key}:`, process.env[key] ? "✔️" : `❌ MISSING`);
});
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn("⚠️ Twilio credentials are missing. SMS features will not work until you add them.");
}
if (!process.env.ADMIN_PASSWORD) {
    console.warn("⚠️ ADMIN_PASSWORD is missing. Admin broadcast feature will not work.");
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
            twiml.message("CurveLink: You're now subscribed. Reply STOP to opt out, HELP for help.");
            console.log(`User ${from} subscribed.`);
        } else if (body.startsWith("REPORT ")) {
            const issue = req.body.Body?.trim().slice(7);
            if (!issue || issue.trim().length === 0) {
                twiml.message("CurveLink: Please include a description of your issue. Example: REPORT Water leak in hallway");
            } else {
                await addReport(from, issue);
                console.log(`📋 Report saved from ${from}: ${issue}`);
                twiml.message("CurveLink: Thank you! Your report has been received and our team will review it shortly.");
            }
        } else if (body === "STOP") {
            await markUserOptedOut(from);
            twiml.message("CurveLink: You've been unsubscribed. Text START to re-subscribe.");
            console.log(`User ${from} opted out.`);
        } else if (body === "HELP") {
            twiml.message("CurveLink: Reply STOP to unsubscribe. For emergencies, call 911. For help, contact your building management.");
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

app.get("/reports", async (req, res) => {
    try {
        const reports = await getReports();
        res.json({ reports });
    } catch (err) {
        console.error("❌ Error fetching reports:", err);
        res.status(500).json({ error: "Failed to fetch reports" });
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
        
        // Send enhanced welcome SMS
        // Use PUBLIC_BASE_URL if set, otherwise use Netlify production URL
        const baseUrl = process.env.PUBLIC_BASE_URL || 'https://curvelinx.netlify.app';
        const reportUrl = `${baseUrl}/report.html`;
        const welcomeMessage = `Welcome to CurveLinx! You are now part of the Gables Residential Safety Network. Save this contact. To report an emergency or safety issue, visit: ${reportUrl}`;
        await sendSMS(normalizedPhone, welcomeMessage);
        console.log(`📱 Welcome SMS sent to: ${normalizedPhone}`);
        
        res.json({ success: true, message: "You're now subscribed to CurveLink!" });
    } catch (err) {
        console.error("❌ Subscription error:", err);
        res.status(500).json({ success: false, message: "Failed to subscribe. Please try again." });
    }
});

// 10. Resident Report Endpoint (Verified Subscribers Only)
app.post("/api/report", async (req, res) => {
    const { phone, issue } = req.body;
    
    if (!phone || !issue) {
        return res.status(400).json({ success: false, message: "Phone number and issue description are required." });
    }
    
    const normalizedPhone = phone.trim();
    const normalizedIssue = issue.trim();
    
    if (normalizedIssue.length < 5) {
        return res.status(400).json({ success: false, message: "Please provide more detail about the issue." });
    }
    
    try {
        // Verify the phone is a registered subscriber
        const isVerified = await isSubscriber(normalizedPhone);
        
        if (!isVerified) {
            return res.status(403).json({ 
                success: false, 
                message: "Number not recognized. Please sign up first." 
            });
        }
        
        // Add the report to the database
        await addReport(normalizedPhone, normalizedIssue);
        console.log(`📋 Web report submitted from ${normalizedPhone}: ${normalizedIssue}`);
        
        res.json({ success: true, message: "Report submitted successfully!" });
    } catch (err) {
        console.error("❌ Report submission error:", err);
        res.status(500).json({ success: false, message: "Failed to submit report. Please try again." });
    }
});

// 11. Password-Protected Admin Broadcast Endpoint
app.post("/admin/broadcast", async (req, res) => {
    const { message, reportId, adminPassword } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Missing "message" field' });
    }
    
    if (!adminPassword) {
        return res.status(400).json({ error: 'Missing admin password' });
    }
    
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    try {
        const subscribers = await getSubscribers();
        const phoneList = subscribers.map(sub => sub.phone);

        if (!phoneList.length) {
            return res.status(200).json({ success: false, message: "No subscribers available." });
        }

        const { lastInsertRowid: messageId } = await addMessage(message);

        for (const phone of phoneList) {
            await linkMessageToRecipient(messageId, phone, "pending");
        }

        const results = await broadcastSMS(phoneList, message);

        for (const r of results) {
            let status = "pending";
            if (r.status === "sent" || r.status === "sent (retry)") status = "sent";
            else if (r.status === "failed") status = "failed";
            await updateRecipientStatus(messageId, r.to, status);
        }

        if (reportId) {
            await updateReportStatus(reportId, "approved");
        }

        res.json({
            success: true,
            messageId,
            totalRecipients: phoneList.length,
            sent: results.filter(r => r.status === "sent" || r.status === "sent (retry)").length,
            failed: results.filter(r => r.status === "failed").length
        });
    } catch (err) {
        console.error("Admin broadcast failed:", err.message || err);
        res.status(500).json({ error: "Broadcast failed", details: err.message || err });
    }
});

// 11. Dismiss Report Endpoint (Password Protected)
app.post("/reports/:id/dismiss", async (req, res) => {
    const reportId = parseInt(req.params.id, 10);
    const { adminPassword } = req.body;
    
    if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID" });
    }
    
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid admin password" });
    }
    
    try {
        await updateReportStatus(reportId, "dismissed");
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to dismiss report:", err);
        res.status(500).json({ error: "Failed to dismiss report" });
    }
});

// 12. DEV ONLY - remove in production
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

// 13. Convenience route for admin dashboard
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

// 12. Health Check Route
app.get("/", (_req, res) => res.send("✅ CurveLink Server is running."));

// 13. Global Error Handler
app.use((err, _req, res, _next) => {
    console.error("🚨 Server Error:", err);
    res.status(500).send("Internal Server Error");
});

// 14. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server listening on port ${PORT}`));
