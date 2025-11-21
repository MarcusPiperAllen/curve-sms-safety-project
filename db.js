const Database = require("better-sqlite3");
const path = require("path");

// Initialize SQLite database
const db = new Database(path.join(__dirname, "curve-sms.db"));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS message_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (message_id) REFERENCES messages(id)
  );
`);

console.log("✅ Database initialized");

// Helper functions
function addSubscriber(phone) {
  const stmt = db.prepare("INSERT OR REPLACE INTO subscribers (phone, status) VALUES (?, 'active')");
  return stmt.run(phone);
}

function getSubscribers() {
  const stmt = db.prepare("SELECT * FROM subscribers WHERE status = 'active'");
  return stmt.all();
}

function removeSubscriber(phone) {
  const stmt = db.prepare("UPDATE subscribers SET status = 'inactive' WHERE phone = ?");
  return stmt.run(phone);
}

function addMessage(body) {
  const stmt = db.prepare("INSERT INTO messages (body) VALUES (?)");
  return stmt.run(body);
}

function linkMessageToRecipient(messageId, phone, status = 'pending') {
  const stmt = db.prepare("INSERT INTO message_recipients (message_id, phone, status) VALUES (?, ?, ?)");
  return stmt.run(messageId, phone, status);
}

function getMessages() {
  const stmt = db.prepare(`
    SELECT
      m.id,
      m.body,
      m.created_at,
      COUNT(mr.id) as total_recipients,
      SUM(CASE WHEN mr.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN mr.status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM messages m
    LEFT JOIN message_recipients mr ON m.id = mr.message_id
    GROUP BY m.id
    ORDER BY m.created_at DESC
  `);
  return stmt.all();
}

module.exports = {
  db,
  addSubscriber,
  getSubscribers,
  removeSubscriber,
  addMessage,
  linkMessageToRecipient,
  getMessages
};
