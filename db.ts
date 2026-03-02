import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('database.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS itinerary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    place_id TEXT,
    title TEXT NOT NULL,
    location_lat REAL,
    location_lng REAL,
    start_time TEXT,
    end_time TEXT,
    type TEXT, -- 'event', 'hotel', 'restaurant', 'attraction'
    notes TEXT,
    FOREIGN KEY (trip_id) REFERENCES trips(id)
  );
`);

export default db;
