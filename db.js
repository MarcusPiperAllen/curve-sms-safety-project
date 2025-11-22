// db.js - PostgreSQL database layer for CURVE SMS Safety
const { Pool } = require("pg");

// Create connection pool
// Uses DATABASE_URL for Render, or individual vars for local dev
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.query("SELECT NOW()")
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => console.error("❌ PostgreSQL connection error:", err.message));

// ============ SUBSCRIBER FUNCTIONS ============

async function addSubscriber(phone) {
  const query = `
    INSERT INTO subscribers (phone, status)
    VALUES ($1, 'active')
    ON CONFLICT (phone)
    DO UPDATE SET status = 'active'
    RETURNING *
  `;
  const result = await pool.query(query, [phone]);
  return result.rows[0];
}

async function getSubscribers() {
  const query = "SELECT * FROM subscribers WHERE status = 'active' ORDER BY created_at DESC";
  const result = await pool.query(query);
  return result.rows;
}

async function removeSubscriber(phone) {
  const query = "UPDATE subscribers SET status = 'inactive' WHERE phone = $1 RETURNING *";
  const result = await pool.query(query, [phone]);
  return result.rows[0];
}

// ============ MESSAGE FUNCTIONS ============

async function addMessage(body) {
  const query = "INSERT INTO messages (body) VALUES ($1) RETURNING id";
  const result = await pool.query(query, [body]);
  return { lastInsertRowid: result.rows[0].id };
}

async function linkMessageToRecipient(messageId, phone, status = 'pending') {
  const query = "INSERT INTO message_recipients (message_id, phone, status) VALUES ($1, $2, $3)";
  await pool.query(query, [messageId, phone, status]);
}

async function getMessages() {
  const query = `
    SELECT
      m.id,
      m.body,
      m.created_at,
      COUNT(mr.id) as total_recipients,
      SUM(CASE WHEN mr.status = 'sent' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN mr.status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM messages m
    LEFT JOIN message_recipients mr ON m.id = mr.message_id
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function updateRecipientStatus(messageId, phone, status) {
  const query = "UPDATE message_recipients SET status = $1 WHERE message_id = $2 AND phone = $3";
  await pool.query(query, [status, messageId, phone]);
}

// ============ EXPORTS ============

module.exports = {
  pool,
  addSubscriber,
  getSubscribers,
  removeSubscriber,
  addMessage,
  linkMessageToRecipient,
  getMessages,
  updateRecipientStatus
};
