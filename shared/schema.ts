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

// Visa API Response Types
export interface VisaApiPassport {
  code: string;
  name: string;
  currency_code?: string;
}

export interface VisaApiDestination {
  code: string;
  name: string;
  continent?: string;
  capital?: string;
  currency_code?: string;
  currency?: string;
  exchange?: string;
  passport_validity?: string;
  phone_code?: string;
  timezone?: string;
  population?: number;
  area_km2?: number;
  embassy_url?: string;
}

export interface VisaApiMandatoryRegistration {
  name: string;
  color: "green" | "blue" | "yellow" | "red";
  link?: string;
}

export interface VisaApiRule {
  name: string;
  duration?: string;
  color: "green" | "blue" | "yellow" | "red";
  link?: string;
}

export interface VisaApiExceptionRule {
  name?: string;
  exception_type_name?: string;
  full_text?: string;
  country_codes?: string[];
  link?: string;
}

export interface VisaApiRules {
  primary_rule: VisaApiRule;
  secondary_rule?: VisaApiRule;
  exception_rule?: VisaApiExceptionRule;
}

export interface VisaApiData {
  passport: VisaApiPassport;
  destination: VisaApiDestination;
  mandatory_registration?: VisaApiMandatoryRegistration;
  visa_rules: VisaApiRules;
}

export interface VisaApiMeta {
  version: string;
  language: string;
  generated_at: string;
}

export interface VisaApiResponse {
  data: VisaApiData;
  meta: VisaApiMeta;
}

// ============== Dynamic Country Fields ==============

export type DynamicFieldKind = "FIELD" | "ATTACHMENT";
export type DynamicFieldDataType = "TEXT" | "ENUM" | "DATE" | "NUMBER";

export interface EnumOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

// Source of auto-fill data (from government systems)
export type AutoFillSource = 
  | "absher_profile"           // MOI - Basic profile info
  | "absher_passport"          // MOI - Passport data
  | "absher_family"            // MOI - Family registry/household
  | "absher_travel_history"    // MOI - Entry/exit movements
  | "gosi_employment"          // GOSI - Employment & salary records
  | "spl_address"              // Saudi Post - Address/residency
  | "ejar_residency";          // Ejar - Rental/residency proof

export interface DynamicField {
  fieldKey: string;
  kind: DynamicFieldKind;
  dataType?: DynamicFieldDataType; // Only for FIELD kind
  labelEn: string;
  labelAr: string;
  mandatory: boolean;
  isRepeatable?: boolean; // Allow multiple uploads/entries
  options?: EnumOption[]; // Only for ENUM type
  noteEn?: string;
  noteAr?: string;
  autoFillSource?: AutoFillSource; // If set, field can be auto-filled
  isShared?: boolean; // If true, one upload/entry applies to all travelers
}

export interface CountryFields {
  countryId: string;
  fields: DynamicField[];
}