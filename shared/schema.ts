import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Owners ───
export const owners = sqliteTable("owners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true, createdAt: true });
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect;

// ─── Pets ───
export const pets = sqliteTable("pets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  species: text("species").default("dog"),
  breed: text("breed"),
  ageYears: real("age_years"),
  weightLbs: real("weight_lbs"),
  medicalNotes: text("medical_notes"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const insertPetSchema = createInsertSchema(pets).omit({ id: true, createdAt: true });
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof pets.$inferSelect;

// ─── Bookings ───
export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull(),
  petId: integer("pet_id").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status").default("pending"),
  address: text("address"),
  scheduledAt: text("scheduled_at"),
  payoutCents: integer("payout_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").notNull(),
  waiverSigned: integer("waiver_signed").default(0),
  paymentStatus: text("payment_status").default("pending"),
  createdAt: text("created_at").default("(datetime('now'))"),
  completedAt: text("completed_at"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, completedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// ─── Clinical Briefs ───
export const clinicalBriefs = sqliteTable("clinical_briefs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id").notNull(),
  petName: text("pet_name").notNull(),
  species: text("species").default("dog"),
  breed: text("breed"),
  ownerName: text("owner_name"),
  subjectiveNote: text("subjective_note"),
  aiTriageSummary: text("ai_triage_summary"),
  symptomTags: text("symptom_tags"),
  urgencyLevel: text("urgency_level").default("routine"),
  triageConversation: text("triage_conversation"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const insertClinicalBriefSchema = createInsertSchema(clinicalBriefs).omit({ id: true, createdAt: true });
export type InsertClinicalBrief = z.infer<typeof insertClinicalBriefSchema>;
export type ClinicalBrief = typeof clinicalBriefs.$inferSelect;

// ─── Liability Waivers ───
export const liabilityWaivers = sqliteTable("liability_waivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  waiverType: text("waiver_type").default("logistics_only"),
  signedAt: text("signed_at").default("(datetime('now'))"),
  ipAddress: text("ip_address"),
  waiverText: text("waiver_text").notNull(),
  signatureHash: text("signature_hash").notNull(),
});

export const insertWaiverSchema = createInsertSchema(liabilityWaivers).omit({ id: true, signedAt: true });
export type InsertWaiver = z.infer<typeof insertWaiverSchema>;
export type LiabilityWaiver = typeof liabilityWaivers.$inferSelect;

// ─── Ancillary Services ───
export const ancillaryServices = sqliteTable("ancillary_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  basePriceCents: integer("base_price_cents").notNull(),
  isActive: integer("is_active").default(1),
});

export const insertAncillaryServiceSchema = createInsertSchema(ancillaryServices).omit({ id: true });
export type InsertAncillaryService = z.infer<typeof insertAncillaryServiceSchema>;
export type AncillaryService = typeof ancillaryServices.$inferSelect;

// ─── Pet Taxi Requests ───
export const petTaxiRequests = sqliteTable("pet_taxi_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id"),
  ownerId: integer("owner_id").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  status: text("status").default("requested"),
  estimatedCostCents: integer("estimated_cost_cents"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const insertPetTaxiSchema = createInsertSchema(petTaxiRequests).omit({ id: true, createdAt: true });
export type InsertPetTaxi = z.infer<typeof insertPetTaxiSchema>;
export type PetTaxiRequest = typeof petTaxiRequests.$inferSelect;

// ─── Service Pricing ───
export const SERVICE_PRICING: Record<string, { label: string; priceCents: number; description: string }> = {
  wellness: { label: "Wellness Visit", priceCents: 15000, description: "Annual checkup with your local independent animal doc" },
  vaccination: { label: "Vaccination", priceCents: 8500, description: "Core vaccines & boosters" },
  sick_visit: { label: "Sick Visit", priceCents: 12000, description: "For illness or injury concerns" },
  senior_care: { label: "Senior Care", priceCents: 17500, description: "Comprehensive senior wellness exam" },
  dental: { label: "Dental", priceCents: 20000, description: "Dental evaluation & cleaning" },
  behavioral: { label: "Behavioral", priceCents: 14000, description: "Behavioral assessment & guidance" },
};

export const PLATFORM_FEE_RATE = 0.15;
