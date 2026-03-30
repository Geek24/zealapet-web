// Vercel Serverless Function — ZealaPet API
// Pure Node.js handler, no Express dependency

import { createHash } from 'crypto';

// ─── In-memory data store (re-initialized on cold start) ───
const data = {
  owners: [], pets: [], bookings: [], waivers: [],
  ancillaryServices: [], petTaxiRequests: [],
  nextId: { owners: 5, pets: 5, bookings: 1, waivers: 1, services: 9, taxi: 1 }
};

// Seed data
data.owners.push(
  { id: 1, name: "Sarah Mitchell", phone: "207-555-0101", email: "sarah.m@example.com", address: "45 Congress St, Portland, ME 04101" },
  { id: 2, name: "James Cooper", phone: "207-555-0102", email: "jcooper@example.com", address: "128 Ocean Ave, Portland, ME 04103" },
  { id: 3, name: "Emily Watson", phone: "207-555-0103", email: "ewatson@example.com", address: "72 Munjoy Hill, Portland, ME 04101" },
  { id: 4, name: "Michael Chen", phone: "207-555-0104", email: "mchen@example.com", address: "310 Forest Ave, Portland, ME 04101" },
);
data.pets.push(
  { id: 1, ownerId: 1, name: "Maple", species: "dog", breed: "Golden Retriever", ageYears: 4, weightLbs: 65 },
  { id: 2, ownerId: 2, name: "Luna", species: "dog", breed: "Husky Mix", ageYears: 2, weightLbs: 45 },
  { id: 3, ownerId: 3, name: "Biscuit", species: "dog", breed: "French Bulldog", ageYears: 6, weightLbs: 28 },
  { id: 4, ownerId: 4, name: "Whiskers", species: "cat", breed: "Maine Coon", ageYears: 8, weightLbs: 18 },
);
data.ancillaryServices.push(
  { id: 1, name: "Pet Taxi — Standard", category: "pet_taxi", description: "Standard pet transport within Portland metro area", basePriceCents: 3500, isActive: 1 },
  { id: 2, name: "Pet Taxi — Extended", category: "pet_taxi", description: "Extended pet transport beyond Portland metro area", basePriceCents: 6500, isActive: 1 },
  { id: 3, name: "Dog Walking — 30 min", category: "dog_walking", description: "30-minute dog walking session", basePriceCents: 2500, isActive: 1 },
  { id: 4, name: "Dog Walking — 60 min", category: "dog_walking", description: "60-minute dog walking session", basePriceCents: 4000, isActive: 1 },
  { id: 5, name: "Grooming — Basic", category: "grooming", description: "Bath, brush, and nail trim", basePriceCents: 5500, isActive: 1 },
  { id: 6, name: "Grooming — Full Service", category: "grooming", description: "Full grooming with haircut and styling", basePriceCents: 8500, isActive: 1 },
  { id: 7, name: "Pet Sitting — Half Day", category: "pet_sitting", description: "Half-day pet sitting in your home", basePriceCents: 4500, isActive: 1 },
  { id: 8, name: "Therapy Visit", category: "therapy", description: "Therapeutic animal interaction visit", basePriceCents: 7500, isActive: 1 },
);

const SERVICE_PRICING = {
  wellness_exam: { priceCents: 8500, label: "Wellness Exam" },
  vaccination: { priceCents: 4500, label: "Vaccination Visit" },
  sick_visit: { priceCents: 12000, label: "Sick Visit" },
  dental: { priceCents: 25000, label: "Dental Cleaning" },
  surgery_consult: { priceCents: 15000, label: "Surgery Consultation" },
  emergency_triage: { priceCents: 20000, label: "Emergency Triage" },
};
const PLATFORM_FEE_RATE = 0.15;
const DISCLAIMER = "ZealaPet provides logistics and scheduling only. Medical care is provided by your independent veterinary contractor.";

const TRIAGE_SYSTEM_PROMPT = `You are ZealaAI, the pre-visit triage assistant for ZealaPet — a mobile veterinary scheduling platform in Maine.

Your job is to interview pet owners BEFORE their animal doc visit to create a Pre-Visit Brief that saves the local independent animal doc 15+ minutes of charting.

INTERVIEW FLOW:
1. Greet the owner warmly and ask for the pet's name, species, and breed
2. Ask about the reason for the visit
3. Ask targeted follow-up questions (3-5): Appetite changes? Vomiting or diarrhea? Behavioral changes? Duration of symptoms? Current medications? Last animal doc visit?
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

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
  });
}

function json(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-ZealaPet-Disclaimer', DISCLAIMER);
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 200;
    return res.end();
  }

  const url = req.url.replace(/\?.*$/, '');
  const method = req.method;

  try {
    // Health check
    if (url === '/api/health') {
      return json(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    }

    // Owners
    if (url === '/api/owners' && method === 'GET') {
      return json(res, 200, { data: data.owners, disclaimer: DISCLAIMER });
    }
    if (url === '/api/owners' && method === 'POST') {
      const body = await parseBody(req);
      const owner = { id: data.nextId.owners++, ...body, createdAt: new Date().toISOString() };
      data.owners.push(owner);
      return json(res, 200, { data: owner, disclaimer: DISCLAIMER });
    }

    // Pets
    const petsMatch = url.match(/^\/api\/pets\/(\d+)$/);
    if (petsMatch && method === 'GET') {
      const pets = data.pets.filter(p => p.ownerId === Number(petsMatch[1]));
      return json(res, 200, { data: pets });
    }
    if (url === '/api/pets' && method === 'POST') {
      const body = await parseBody(req);
      const pet = { id: data.nextId.pets++, ...body, createdAt: new Date().toISOString() };
      data.pets.push(pet);
      return json(res, 200, { data: pet });
    }

    // Services
    if (url === '/api/services' && method === 'GET') {
      return json(res, 200, { data: data.ancillaryServices, pricing: SERVICE_PRICING, feeRate: PLATFORM_FEE_RATE });
    }

    // Bookings
    if (url === '/api/bookings' && method === 'GET') {
      return json(res, 200, { data: data.bookings, disclaimer: DISCLAIMER });
    }
    const bookingMatch = url.match(/^\/api\/bookings\/(\d+)$/);
    if (bookingMatch && method === 'GET') {
      const booking = data.bookings.find(b => b.id === Number(bookingMatch[1]));
      if (!booking) return json(res, 404, { error: "Booking not found" });
      return json(res, 200, { data: booking, disclaimer: DISCLAIMER });
    }
    if (url === '/api/bookings' && method === 'POST') {
      const body = await parseBody(req);
      const { serviceType, ownerData, petData, address, scheduledAt } = body;
      const owner = { id: data.nextId.owners++, ...ownerData, createdAt: new Date().toISOString() };
      data.owners.push(owner);
      const pet = { id: data.nextId.pets++, ...petData, ownerId: owner.id, createdAt: new Date().toISOString() };
      data.pets.push(pet);
      const service = SERVICE_PRICING[serviceType];
      if (!service) return json(res, 400, { error: "Invalid service type" });
      const platformFeeCents = Math.round(service.priceCents * PLATFORM_FEE_RATE);
      const booking = {
        id: data.nextId.bookings++, ownerId: owner.id, petId: pet.id, serviceType,
        payoutCents: service.priceCents, platformFeeCents, address, scheduledAt,
        status: "pending", paymentStatus: "pending", waiverSigned: 0,
        createdAt: new Date().toISOString(), completedAt: null,
      };
      data.bookings.push(booking);
      return json(res, 200, { data: { booking, owner, pet }, pricing: { servicePriceCents: service.priceCents, platformFeeCents, totalCents: service.priceCents + platformFeeCents }, disclaimer: DISCLAIMER });
    }

    // Waivers
    if (url === '/api/waivers' && method === 'POST') {
      const body = await parseBody(req);
      const signatureHash = createHash("sha256").update(body.waiverText + Date.now()).digest("hex");
      const waiver = { id: data.nextId.waivers++, ...body, signatureHash, waiverType: "logistics_only", signedAt: new Date().toISOString() };
      data.waivers.push(waiver);
      return json(res, 200, { data: waiver });
    }

    // Pet Taxi
    if (url === '/api/pet-taxi' && method === 'GET') {
      return json(res, 200, { data: data.petTaxiRequests });
    }
    if (url === '/api/pet-taxi' && method === 'POST') {
      const body = await parseBody(req);
      const taxi = { id: data.nextId.taxi++, ...body, status: "requested", createdAt: new Date().toISOString() };
      data.petTaxiRequests.push(taxi);
      return json(res, 200, { data: taxi, disclaimer: DISCLAIMER });
    }

    // AI Chat (Gemini)
    if (url === '/api/chat' && method === 'POST') {
      const body = await parseBody(req);
      const { messages } = body;
      if (!messages || !Array.isArray(messages)) {
        return json(res, 400, { error: "messages array required" });
      }
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && PHARMACY_KEYWORDS.some(kw => (lastMsg.content || '').toLowerCase().includes(kw))) {
        return json(res, 200, { response: "I'm sorry, but I cannot assist with prescription or pharmacy requests. ZealaPet is a logistics and scheduling platform only. Please consult your veterinary professional directly for medication needs.\n\n*" + DISCLAIMER + "*" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return json(res, 200, { response: "Hi there! I'm ZealaAI, your pre-visit triage assistant. I help prepare a brief for your vet before your visit. The AI service is currently being configured. Please check back soon!\n\n*" + DISCLAIMER + "*" });
      }

      try {
        // Build Gemini conversation history
        // Gemini uses "user" and "model" roles; map our "assistant" -> "model"
        const geminiContents = [
          { role: "user", parts: [{ text: "System instructions: " + TRIAGE_SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "Understood. I am ZealaAI, the compassionate pre-visit triage assistant for ZealaPet. I'm ready to help pet parents prepare for their vet visits. How can I help you today?" }] },
        ];

        for (const msg of messages) {
          const role = msg.role === 'assistant' ? 'model' : 'user';
          const parts = [];

          // Handle image attachments on the last message
          if (msg === lastMsg && body.imageBase64 && body.mimeType) {
            parts.push({ inlineData: { mimeType: body.mimeType, data: body.imageBase64 } });
          }
          parts.push({ text: msg.content || "Please look at this image of my pet." });
          geminiContents.push({ role, parts });
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiContents,
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
              ],
              generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
              },
            }),
          }
        );

        const geminiData = await geminiRes.json();
        if (!geminiRes.ok) {
          console.error('Gemini API error:', JSON.stringify(geminiData));
          return json(res, 200, { response: "I'm having trouble connecting right now. Please try again in a moment.\n\n*" + DISCLAIMER + "*" });
        }

        const candidate = geminiData.candidates && geminiData.candidates[0];
        const textPart = candidate && candidate.content && candidate.content.parts && candidate.content.parts.find(p => p.text);
        return json(res, 200, { response: textPart ? textPart.text : "I couldn't process that. Could you try again?" });
      } catch (chatErr) {
        console.error("Chat API error:", chatErr);
        return json(res, 200, { response: "I'm having trouble connecting to my AI service right now. Please try again in a moment.\n\n*" + DISCLAIMER + "*" });
      }
    }

    // 404
    return json(res, 404, { error: "Not found" });

  } catch (err) {
    console.error("Handler error:", err);
    return json(res, 500, { error: "Internal server error" });
  }
};
