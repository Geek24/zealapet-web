import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db } from "./storage";
import { owners, pets, bookings, clinicalBriefs, liabilityWaivers, ancillaryServices, petTaxiRequests } from "@shared/schema";
import { sql } from "drizzle-orm";
import { seedDatabase } from "./seed";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).slice(0, 200)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Initialize database tables
function initializeDB() {
  db.run(sql`CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT DEFAULT 'dog',
    breed TEXT,
    age_years REAL,
    weight_lbs REAL,
    medical_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    pet_id INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    address TEXT,
    scheduled_at TEXT,
    payout_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    waiver_signed INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (owner_id) REFERENCES owners(id),
    FOREIGN KEY (pet_id) REFERENCES pets(id)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS clinical_briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    pet_name TEXT NOT NULL,
    species TEXT DEFAULT 'dog',
    breed TEXT,
    owner_name TEXT,
    subjective_note TEXT,
    ai_triage_summary TEXT,
    symptom_tags TEXT,
    urgency_level TEXT DEFAULT 'routine',
    triage_conversation TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS liability_waivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    waiver_type TEXT DEFAULT 'logistics_only',
    signed_at TEXT DEFAULT (datetime('now')),
    ip_address TEXT,
    waiver_text TEXT NOT NULL,
    signature_hash TEXT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS ancillary_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    base_price_cents INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS pet_taxi_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    owner_id INTEGER NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    status TEXT DEFAULT 'requested',
    estimated_cost_cents INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  )`);
}

(async () => {
  // Initialize DB tables and seed data
  initializeDB();
  seedDatabase();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => { log(`serving on port ${port}`); },
  );
})();
