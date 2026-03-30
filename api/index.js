// Vercel Serverless Function wrapper for Express API
// This creates a standalone Express app for API routes in serverless context

const express = require('express');
const { createHash } = require('crypto');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── In-memory data store (re-initialized on cold start) ───
const data = {
  owners: [],
  pets: [],
  bookings: [],
  clinicalBriefs: [],
  waivers: [],
  ancillaryServices: [],
  petTaxiRequests: [],
  nextId: { owners: 1, pets: 1, bookings: 1, briefs: 1, waivers: 1, services: 1, taxi: 1 }
};

// Seed data on initialization
function seedData() {
  const ownerData = [
    { name: "Sarah Mitchell", phone: "207-555-0101", email: "sarah.m@example.com", address: "45 Congress St, Portland, ME 04101", latitude: 43.6591, longitude: -70.2568 },
    { name: "James Cooper", phone: "207-555-0102", email: "jcooper@example.com", address: "128 Ocean Ave, Portland, ME 04103", latitude: 43.6414, longitude: -70.2451 },
    { name: "Emily Watson", phone: "207-555-0103", email: "ewatson@example.com", address: "72 Munjoy Hill, Portland, ME 04101", latitude: 43.6628, longitude: -70.2488 },
    { name: "Michael Chen", phone: "207-555-0104", email: "mchen@example.com", address: "310 Forest Ave, Portland, ME 04101", latitude: 43.6705, longitude: -70.2775 },
  ];
  ownerData.forEach(o => {
    data.owners.push({ id: data.nextId.owners++, ...o, createdAt: new Date().toISOString() });
  });

  const petData = [
    { ownerId: 1, name: "Maple", species: "dog", breed: "Golden Retriever", ageYears: 4, weightLbs: 65 },
    { ownerId: 2, name: "Luna", species: "dog", breed: "Husky Mix", ageYears: 2, weightLbs: 45 },
    { ownerId: 3, name: "Biscuit", species: "dog", breed: "French Bulldog", ageYears: 6, weightLbs: 28 },
    { ownerId: 4, name: "Whiskers", species: "cat", breed: "Maine Coon", ageYears: 8, weightLbs: 18 },
  ];
  petData.forEach(p => {
    data.pets.push({ id: data.nextId.pets++, ...p, medicalNotes: null, createdAt: new Date().toISOString() });
  });

  const serviceData = [
    { name: "Pet Taxi — Standard", category: "pet_taxi", description: "Standard pet transport within Portland metro area", basePriceCents: 3500, isActive: 1 },
    { name: "Pet Taxi — Extended", category: "pet_taxi", description: "Extended pet transport beyond Portland metro area", basePriceCents: 6500, isActive: 1 },
    { name: "Dog Walking — 30 min", category: "dog_walking", description: "30-minute dog walking session", basePriceCents: 2500, isActive: 1 },
    { name: "Dog Walking — 60 min", category: "dog_walking", description: "60-minute dog walking session", basePriceCents: 4000, isActive: 1 },
    { name: "Grooming — Basic", category: "grooming", description: "Bath, brush, and nail trim", basePriceCents: 5500, isActive: 1 },
    { name: "Grooming — Full Service", category: "grooming", description: "Full grooming with haircut and styling", basePriceCents: 8500, isActive: 1 },
    { name: "Pet Sitting — Half Day", category: "pet_sitting", description: "Half-day pet sitting in your home", basePriceCents: 4500, isActive: 1 },
    { name: "Therapy Visit", category: "therapy", description: "Therapeutic animal interaction visit", basePriceCents: 7500, isActive: 1 },
  ];
  serviceData.forEach(s => {
    data.ancillaryServices.push({ id: data.nextId.services++, ...s });
  });
}

seedData();

const SERVICE_PRICING = {
  wellness_exam: { priceCents: 8500, label: "Wellness Exam" },
  vaccination: { priceCents: 4500, label: "Vaccination Visit" },
  sick_visit: { priceCents: 12000, label: "Sick Visit" },
  dental: { priceCents: 25000, label: "Dental Cleaning" },
  surgery_consult: { priceCents: 15000, label: "Surgery Consultation" },
  emergency_triage: { priceCents: 20000, label: "Emergency Triage" },
};

const PLATFORM_FEE_RATE = 0.15;

const LOGISTICS_DISCLAIMER = "ZealaPet provides logistics and scheduling only. Medical care is provided by your independent veterinary contractor.";

const TRIAGE_SYSTEM_PROMPT = `You are ZealaAI, the pre-visit triage assistant for ZealaPet — a mobile veterinary scheduling platform in Maine.

Your job is to interview pet owners BEFORE their animal doc visit to create a Pre-Visit Brief that saves the local independent animal doc 15+ minutes of charting.

INTERVIEW FLOW:
1. Greet the owner warmly and ask for the pet's name, species, and breed
2. Ask about the reason for the visit
3. Ask targeted follow-up questions (3-5):
   - Appetite changes?
   - Vomiting or diarrhea?
   - Behavioral changes?
   - Duration of symptoms?
   - Current medications?
   - Last animal doc visit?
4. After gathering enough info, generate summary as:

**Pre-Visit Brief for [Pet Name]**
- **Species/Breed:** [info]
- **Chief Complaint:** [main reason]
- **Symptoms:** [bulleted list]
- **Duration:** [timeframe]
- **Relevant History:** [context]
- **Urgency:** [Routine / Moderate / Urgent]
- **AI Triage Note:** [1-2 sentence clinical summary]

CRITICAL RULES:
- Never diagnose or prescribe
- If emergency symptoms (breathing difficulty, seizures, collapse, poisoning, bloat), IMMEDIATELY redirect to ER
- Be warm, empathetic, conversational
- After summary: "I'll share this with your local independent animal doc so they're prepared!"

DISCLAIMER: ZealaPet provides logistics and scheduling only. Medical care is provided by your independent veterinary contractor.`;

const PHARMACY_KEYWORDS = ["prescription", "prescribe", "pharmacy", "medication order", "drug", "dispense", "refill", "controlled substance"];

function containsPharmacyKeywords(text) {
  const lower = text.toLowerCase();
  return PHARMACY_KEYWORDS.some(keyword => lower.includes(keyword));
}

// ─── CORS ───
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ─── Compliance middleware ───
app.use("/api", (_req, res, next) => {
  res.setHeader("X-ZealaPet-Disclaimer", LOGISTICS_DISCLAIMER);
  next();
});

// ─── Owners ───
app.get("/api/owners", (_req, res) => {
  res.json({ data: data.owners, disclaimer: LOGISTICS_DISCLAIMER });
});

app.post("/api/owners", (req, res) => {
  const owner = { id: data.nextId.owners++, ...req.body, createdAt: new Date().toISOString() };
  data.owners.push(owner);
  res.json({ data: owner, disclaimer: LOGISTICS_DISCLAIMER });
});

// ─── Pets ───
app.get("/api/pets/:ownerId", (req, res) => {
  const pets = data.pets.filter(p => p.ownerId === Number(req.params.ownerId));
  res.json({ data: pets });
});

app.post("/api/pets", (req, res) => {
  const pet = { id: data.nextId.pets++, ...req.body, createdAt: new Date().toISOString() };
  data.pets.push(pet);
  res.json({ data: pet });
});

// ─── Services ───
app.get("/api/services", (_req, res) => {
  res.json({ data: data.ancillaryServices, pricing: SERVICE_PRICING, feeRate: PLATFORM_FEE_RATE });
});

// ─── Bookings ───
app.get("/api/bookings", (_req, res) => {
  res.json({ data: data.bookings, disclaimer: LOGISTICS_DISCLAIMER });
});

app.get("/api/bookings/:id", (req, res) => {
  const booking = data.bookings.find(b => b.id === Number(req.params.id));
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json({ data: booking, disclaimer: LOGISTICS_DISCLAIMER });
});

app.post("/api/bookings", (req, res) => {
  const { serviceType, ownerData, petData, address, scheduledAt } = req.body;
  const owner = { id: data.nextId.owners++, ...ownerData, createdAt: new Date().toISOString() };
  data.owners.push(owner);
  const pet = { id: data.nextId.pets++, ...petData, ownerId: owner.id, createdAt: new Date().toISOString() };
  data.pets.push(pet);

  const service = SERVICE_PRICING[serviceType];
  if (!service) return res.status(400).json({ error: "Invalid service type" });

  const platformFeeCents = Math.round(service.priceCents * PLATFORM_FEE_RATE);
  const payoutCents = service.priceCents;

  const booking = {
    id: data.nextId.bookings++,
    ownerId: owner.id, petId: pet.id, serviceType,
    payoutCents, platformFeeCents, address, scheduledAt,
    status: "pending", paymentStatus: "pending", waiverSigned: 0,
    createdAt: new Date().toISOString(), completedAt: null,
  };
  data.bookings.push(booking);
  res.json({ data: { booking, owner, pet }, pricing: { servicePriceCents: payoutCents, platformFeeCents, totalCents: payoutCents + platformFeeCents }, disclaimer: LOGISTICS_DISCLAIMER });
});

// ─── Waiver ───
app.post("/api/waivers", (req, res) => {
  const { bookingId, ownerId, waiverText } = req.body;
  const signatureHash = createHash("sha256").update(waiverText + Date.now()).digest("hex");
  const waiver = {
    id: data.nextId.waivers++, bookingId, ownerId, waiverText, signatureHash,
    waiverType: "logistics_only", signedAt: new Date().toISOString(), ipAddress: req.ip || "unknown"
  };
  data.waivers.push(waiver);
  res.json({ data: waiver });
});

// ─── Pet Taxi ───
app.post("/api/pet-taxi", (req, res) => {
  const taxi = { id: data.nextId.taxi++, ...req.body, status: "requested", createdAt: new Date().toISOString() };
  data.petTaxiRequests.push(taxi);
  res.json({ data: taxi, disclaimer: LOGISTICS_DISCLAIMER });
});

app.get("/api/pet-taxi", (_req, res) => {
  res.json({ data: data.petTaxiRequests });
});

// ─── AI Chat (ZealaAI Triage) ───
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, imageBase64, mimeType } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg && containsPharmacyKeywords(lastMsg.content || "")) {
      return res.json({
        response: "I'm sorry, but I cannot assist with prescription or pharmacy requests. ZealaPet is a logistics and scheduling platform only. Please consult your veterinary professional directly for medication needs.\n\n*" + LOGISTICS_DISCLAIMER + "*",
      });
    }

    // Use Anthropic API if key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.json({
        response: "Hi there! I'm ZealaAI, your pre-visit triage assistant. I help prepare a brief for your vet before your visit. Unfortunately, the AI service is currently being configured. Please check back soon!\n\n*" + LOGISTICS_DISCLAIMER + "*",
      });
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const apiMessages = messages.map((msg, i) => {
      if (i === messages.length - 1 && imageBase64 && mimeType) {
        return {
          role: msg.role,
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
            { type: "text", text: msg.content || "Please look at this image of my pet." },
          ],
        };
      }
      return { role: msg.role, content: msg.content };
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: TRIAGE_SYSTEM_PROMPT,
      messages: apiMessages,
    });

    const textContent = response.content.find(c => c.type === "text");
    const responseText = textContent ? textContent.text : "I'm sorry, I couldn't process that. Could you try again?";
    res.json({ response: responseText });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat message. Please try again." });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = app;
