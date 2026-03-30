import {
  type Owner, type InsertOwner, owners,
  type Pet, type InsertPet, pets,
  type Booking, type InsertBooking, bookings,
  type ClinicalBrief, type InsertClinicalBrief, clinicalBriefs,
  type LiabilityWaiver, type InsertWaiver, liabilityWaivers,
  type AncillaryService, type InsertAncillaryService, ancillaryServices,
  type PetTaxiRequest, type InsertPetTaxi, petTaxiRequests,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

// Use in-memory DB for serverless (Vercel), file-based for local dev
const isServerless = process.env.VERCEL === '1';
const sqlite = new Database(isServerless ? ':memory:' : 'data.db');
if (!isServerless) sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite);

export interface IStorage {
  // Owners
  getOwner(id: number): Owner | undefined;
  getOwners(): Owner[];
  createOwner(owner: InsertOwner): Owner;

  // Pets
  getPet(id: number): Pet | undefined;
  getPetsByOwner(ownerId: number): Pet[];
  createPet(pet: InsertPet): Pet;

  // Bookings
  getBooking(id: number): Booking | undefined;
  getBookings(): Booking[];
  createBooking(booking: InsertBooking): Booking;

  // Clinical Briefs
  getClinicalBrief(id: number): ClinicalBrief | undefined;
  createClinicalBrief(brief: InsertClinicalBrief): ClinicalBrief;

  // Waivers
  createWaiver(waiver: InsertWaiver): LiabilityWaiver;

  // Ancillary Services
  getAncillaryServices(): AncillaryService[];
  createAncillaryService(service: InsertAncillaryService): AncillaryService;

  // Pet Taxi
  createPetTaxiRequest(req: InsertPetTaxi): PetTaxiRequest;
  getPetTaxiRequests(): PetTaxiRequest[];
}

export class DatabaseStorage implements IStorage {
  // Owners
  getOwner(id: number): Owner | undefined {
    return db.select().from(owners).where(eq(owners.id, id)).get();
  }
  getOwners(): Owner[] {
    return db.select().from(owners).all();
  }
  createOwner(owner: InsertOwner): Owner {
    return db.insert(owners).values(owner).returning().get();
  }

  // Pets
  getPet(id: number): Pet | undefined {
    return db.select().from(pets).where(eq(pets.id, id)).get();
  }
  getPetsByOwner(ownerId: number): Pet[] {
    return db.select().from(pets).where(eq(pets.ownerId, ownerId)).all();
  }
  createPet(pet: InsertPet): Pet {
    return db.insert(pets).values(pet).returning().get();
  }

  // Bookings
  getBooking(id: number): Booking | undefined {
    return db.select().from(bookings).where(eq(bookings.id, id)).get();
  }
  getBookings(): Booking[] {
    return db.select().from(bookings).all();
  }
  createBooking(booking: InsertBooking): Booking {
    return db.insert(bookings).values(booking).returning().get();
  }

  // Clinical Briefs
  getClinicalBrief(id: number): ClinicalBrief | undefined {
    return db.select().from(clinicalBriefs).where(eq(clinicalBriefs.id, id)).get();
  }
  createClinicalBrief(brief: InsertClinicalBrief): ClinicalBrief {
    return db.insert(clinicalBriefs).values(brief).returning().get();
  }

  // Waivers
  createWaiver(waiver: InsertWaiver): LiabilityWaiver {
    return db.insert(liabilityWaivers).values(waiver).returning().get();
  }

  // Ancillary Services
  getAncillaryServices(): AncillaryService[] {
    return db.select().from(ancillaryServices).all();
  }
  createAncillaryService(service: InsertAncillaryService): AncillaryService {
    return db.insert(ancillaryServices).values(service).returning().get();
  }

  // Pet Taxi
  createPetTaxiRequest(req: InsertPetTaxi): PetTaxiRequest {
    return db.insert(petTaxiRequests).values(req).returning().get();
  }
  getPetTaxiRequests(): PetTaxiRequest[] {
    return db.select().from(petTaxiRequests).all();
  }
}

export const storage = new DatabaseStorage();
