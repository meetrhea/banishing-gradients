import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Use DATA_DIR env var if set, otherwise default to ./data in project root
const dataDir = process.env.DATA_DIR || join(process.cwd(), 'data');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'banishing-gradients.db');

// Create database connection (creates file if doesn't exist)
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TEXT DEFAULT (datetime('now')),
    confirmed INTEGER DEFAULT 0,
    unsubscribed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    slug TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
  CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
  CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
`);

// Prepared statements for better performance
const insertSubscriber = db.prepare(`
  INSERT INTO subscribers (email) VALUES (?)
  ON CONFLICT(email) DO UPDATE SET unsubscribed = 0
`);

const insertEvent = db.prepare(`
  INSERT INTO events (event_type, slug, referrer, user_agent, ip, metadata)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getSubscriberCount = db.prepare(`
  SELECT COUNT(*) as count FROM subscribers WHERE unsubscribed = 0
`);

const getEventStats = db.prepare(`
  SELECT event_type, COUNT(*) as count
  FROM events
  WHERE created_at > datetime('now', '-7 days')
  GROUP BY event_type
`);

const getArticleViews = db.prepare(`
  SELECT slug, COUNT(*) as views
  FROM events
  WHERE event_type = 'page_view' AND slug IS NOT NULL
  GROUP BY slug
  ORDER BY views DESC
  LIMIT 10
`);

export {
  db,
  insertSubscriber,
  insertEvent,
  getSubscriberCount,
  getEventStats,
  getArticleViews,
};
