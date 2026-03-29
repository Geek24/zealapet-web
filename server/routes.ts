import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertOwnerSchema, insertPetSchema, insertBookingSchema,
  insertPetTaxiSchema, insertWaiverSchema,
  SERVICE_PRICING, PLATFORM_FEE_RATE,
} from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";

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

const LOGISTICS_DISCLAIMER = "ZealaPet provides logistics and scheduling only. Medical care is provided by your independent veterinary contractor.";

// Pharmacy keyword blocking
const PHARMACY_KEYWORDS = [
  "prescription", "prescribe", "pharmacy", "medication order",
  "drug", "dispense", "refill", "controlled substance"
];

function containsPharmacyKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return PHARMACY_KEYWORDS.some(keyword => lower.includes(keyword));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Compliance middleware ───
  app.use("/api", (_req, res, next) => {
    res.setHeader("X-ZealaPet-Disclaimer", LOGISTICS_DISCLAIMER);
    next();
  });

  // ─── Owners ───
  app.get("/api/owners", (_req, res) => {
    const owners = storage.getOwners();
    res.json({ data: owners, disclaimer: LOGISTICS_DISCLAIMER });
  });

  app.post("/api/owners", (req, res) => {
    const parsed = insertOwnerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const owner = storage.createOwner(parsed.data);
    res.json({ data: owner, disclaimer: LOGISTICS_DISCLAIMER });
  });

  // ─── Pets ───
  app.get("/api/pets/:ownerId", (req, res) => {
    const pets = storage.getPetsByOwner(Number(req.params.ownerId));
    res.json({ data: pets });
  });

  app.post("/api/pets", (req, res) => {
    const parsed = insertPetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const pet = storage.createPet(parsed.data);
    res.json({ data: pet });
  });

  // ─── Services ───
  app.get("/api/services", (_req, res) => {
    const services = storage.getAncillaryServices();
    res.json({ data: services, pricing: SERVICE_PRICING, feeRate: PLATFORM_FEE_RATE });
  });

  // ─── Bookings ───
  app.get("/api/bookings", (_req, res) => {
    const bookingList = storage.getBookings();
    res.json({ data: bookingList, disclaimer: LOGISTICS_DISCLAIMER });
  });

  app.get("/api/bookings/:id", (req, res) => {
    const booking = storage.getBooking(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json({ data: booking, disclaimer: LOGISTICS_DISCLAIMER });
  });

  app.post("/api/bookings", (req, res) => {
    const { serviceType, ownerData, petData, address, scheduledAt } = req.body;

    // Create owner
    const owner = storage.createOwner(ownerData);
    // Create pet linked to owner
    const pet = storage.createPet({ ...petData, ownerId: owner.id });

    // Calculate pricing
    const service = SERVICE_PRICING[serviceType];
    if (!service) return res.status(400).json({ error: "Invalid service type" });

    const platformFeeCents = Math.round(service.priceCents * PLATFORM_FEE_RATE);
    const payoutCents = service.priceCents;

    const booking = storage.createBooking({
      ownerId: owner.id,
      petId: pet.id,
      serviceType,
      payoutCents,
      platformFeeCents,
      address,
      scheduledAt,
      status: "pending",
      paymentStatus: "pending",
      waiverSigned: 0,
    });

    res.json({
      data: { booking, owner, pet },
      pricing: {
        servicePriceCents: payoutCents,
        platformFeeCents,
        totalCents: payoutCents + platformFeeCents,
      },
      disclaimer: LOGISTICS_DISCLAIMER,
    });
  });

  // ─── Waiver ───
  app.post("/api/waivers", (req, res) => {
    const { bookingId, ownerId, waiverText } = req.body;
    const signatureHash = createHash("sha256").update(waiverText + Date.now()).digest("hex");
    const waiver = storage.createWaiver({
      bookingId,
      ownerId,
      waiverText,
      signatureHash,
      waiverType: "logistics_only",
      ipAddress: req.ip || "unknown",
    });
    res.json({ data: waiver });
  });

  // ─── Pet Taxi ───
  app.post("/api/pet-taxi", (req, res) => {
    const parsed = insertPetTaxiSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const taxi = storage.createPetTaxiRequest(parsed.data);
    res.json({ data: taxi, disclaimer: LOGISTICS_DISCLAIMER });
  });

  app.get("/api/pet-taxi", (_req, res) => {
    const requests = storage.getPetTaxiRequests();
    res.json({ data: requests });
  });

  // ─── AI Chat (ZealaAI Triage) ───
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, imageBase64, mimeType } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array required" });
      }

      // Check for pharmacy keywords in last message
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && containsPharmacyKeywords(lastMsg.content || "")) {
        return res.json({
          response: "I'm sorry, but I cannot assist with prescription or pharmacy requests. ZealaPet is a logistics and scheduling platform only. Please consult your veterinary professional directly for medication needs.\n\n*" + LOGISTICS_DISCLAIMER + "*",
        });
      }

      const client = new Anthropic();

      // Build messages with potential image content
      const apiMessages = messages.map((msg: any, i: number) => {
        if (i === messages.length - 1 && imageBase64 && mimeType) {
          return {
            role: msg.role,
            content: [
              {
                type: "image" as const,
                source: {
                  type: "base64" as const,
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              { type: "text" as const, content: msg.content || "Please look at this image of my pet." },
            ],
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const response = await client.messages.create({
        model: "claude_sonnet_4_6",
        max_tokens: 1024,
        system: TRIAGE_SYSTEM_PROMPT,
        messages: apiMessages,
      });

      const textContent = response.content.find((c: any) => c.type === "text");
      const responseText = textContent ? (textContent as any).text : "I'm sorry, I couldn't process that. Could you try again?";

      res.json({ response: responseText });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message. Please try again." });
    }
  });

  return httpServer;
}
