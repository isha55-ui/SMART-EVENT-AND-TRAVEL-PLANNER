import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.ts";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
      const result = stmt.run(email, hashedPassword, name);
      const token = jwt.sign({ id: result.lastInsertRowid, email, name }, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: { id: result.lastInsertRowid, email, name } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // Trips
  app.get("/api/trips", authenticateToken, (req: any, res) => {
    const trips = db.prepare("SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(trips);
  });

  app.post("/api/trips", authenticateToken, (req: any, res) => {
    const { title, start_date, end_date } = req.body;
    const stmt = db.prepare("INSERT INTO trips (user_id, title, start_date, end_date) VALUES (?, ?, ?, ?)");
    const result = stmt.run(req.user.id, title, start_date, end_date);
    res.json({ id: result.lastInsertRowid, title, start_date, end_date });
  });

  app.get("/api/trips/:id/itinerary", authenticateToken, (req: any, res) => {
    const items = db.prepare("SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY start_time ASC").all(req.params.id);
    res.json(items);
  });

  app.post("/api/trips/:id/itinerary", authenticateToken, (req: any, res) => {
    const { title, place_id, location_lat, location_lng, start_time, end_time, type, notes } = req.body;
    const stmt = db.prepare(`
      INSERT INTO itinerary_items (trip_id, title, place_id, location_lat, location_lng, start_time, end_time, type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.params.id, title, place_id, location_lat, location_lng, start_time, end_time, type, notes);
    res.json({ id: result.lastInsertRowid, title, place_id, location_lat, location_lng, start_time, end_time, type, notes });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
