import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Country with visa status
export type VisaStatus = "visa_required" | "e_visa" | "visa_free" | "not_allowed";

export interface Country {
  id: string;
  name: string;
  nameAr: string;
  flag: string;
  visaStatus: VisaStatus;
}

// Visa types
export interface VisaType {
  id: string;
  name: string;
  nameAr: string;
}

// Traveler (family member)
export interface Traveler {
  id: string;
  name: string;
  nameAr: string;
  relationship: string;
  relationshipAr: string;
  idNumber: string;
  passportExpiry: string;
  selected: boolean;
}

// Visa requirement
export type RequirementStatus = "available" | "to_provide" | "missing";

export interface VisaRequirement {
  id: string;
  description: string;
  descriptionAr: string;
  status: RequirementStatus;
}

// Traveler document status
export interface TravelerDocStatus {
  travelerId: string;
  travelerName: string;
  relationship: string;
  status: "ready" | "missing_items";
  missingCount: number;
  requirements: VisaRequirement[];
}

// Embassy appointment slot
export interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

// Embassy info
export interface Embassy {
  id: string;
  countryId: string;
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  hasIntegration: boolean;
  externalBookingUrl?: string;
  availableSlots: AppointmentSlot[];
}

// Visa request status
export type RequestStatus = "draft" | "completed";

// Visa request
export interface VisaRequest {
  id: string;
  countryId: string;
  countryName: string;
  visaTypeId: string;
  visaTypeName: string;
  travelers: string[];
  status: RequestStatus;
  createdAt: string;
  appointmentDate?: string;
  appointmentTime?: string;
  embassyId?: string;
}

// Insert visa request schema
export const insertVisaRequestSchema = z.object({
  countryId: z.string().min(1),
  visaTypeId: z.string().min(1),
  travelers: z.array(z.string()).min(1),
});

export type InsertVisaRequest = z.infer<typeof insertVisaRequestSchema>;

// Update visa request schema
export const updateVisaRequestSchema = z.object({
  status: z.enum(["draft", "completed"]).optional(),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  embassyId: z.string().optional(),
});

export type UpdateVisaRequest = z.infer<typeof updateVisaRequestSchema>;
