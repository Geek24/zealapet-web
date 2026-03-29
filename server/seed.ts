import { db } from "./storage";
import { owners, pets, ancillaryServices } from "@shared/schema";

export function seedDatabase() {
  // Check if already seeded
  const existing = db.select().from(owners).all();
  if (existing.length > 0) return;

  console.log("Seeding database...");

  // Seed owners
  const ownerData = [
    { name: "Sarah Mitchell", phone: "207-555-0101", email: "sarah.m@example.com", address: "45 Congress St, Portland, ME 04101", latitude: 43.6591, longitude: -70.2568 },
    { name: "James Cooper", phone: "207-555-0102", email: "jcooper@example.com", address: "128 Ocean Ave, Portland, ME 04103", latitude: 43.6414, longitude: -70.2451 },
    { name: "Emily Watson", phone: "207-555-0103", email: "ewatson@example.com", address: "72 Munjoy Hill, Portland, ME 04101", latitude: 43.6628, longitude: -70.2488 },
    { name: "Michael Chen", phone: "207-555-0104", email: "mchen@example.com", address: "310 Forest Ave, Portland, ME 04101", latitude: 43.6705, longitude: -70.2775 },
  ];

  const createdOwners = ownerData.map(o => db.insert(owners).values(o).returning().get());

  // Seed pets
  const petData = [
    { ownerId: createdOwners[0].id, name: "Maple", species: "dog", breed: "Golden Retriever", ageYears: 4, weightLbs: 65 },
    { ownerId: createdOwners[1].id, name: "Luna", species: "dog", breed: "Husky Mix", ageYears: 2, weightLbs: 45 },
    { ownerId: createdOwners[2].id, name: "Biscuit", species: "dog", breed: "French Bulldog", ageYears: 6, weightLbs: 28 },
    { ownerId: createdOwners[3].id, name: "Whiskers", species: "cat", breed: "Maine Coon", ageYears: 8, weightLbs: 18 },
  ];

  petData.forEach(p => db.insert(pets).values(p).returning().get());

  // Seed ancillary services
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

  serviceData.forEach(s => db.insert(ancillaryServices).values(s).returning().get());

  console.log("Database seeded successfully.");
}
