import { type User, type InsertUser, type Country, type VisaType, type Traveler, type VisaRequirement, type TravelerDocStatus, type Embassy, type VisaRequest, type InsertVisaRequest, type UpdateVisaRequest } from "@shared/schema";
import { randomUUID } from "crypto";

// Mock data for countries
const mockCountries: Country[] = [
  { id: "fr", name: "France", nameAr: "فرنسا", flag: "🇫🇷", visaStatus: "visa_required" },
  { id: "de", name: "Germany", nameAr: "ألمانيا", flag: "🇩🇪", visaStatus: "visa_required" },
  { id: "gb", name: "United Kingdom", nameAr: "المملكة المتحدة", flag: "🇬🇧", visaStatus: "visa_required" },
  { id: "us", name: "United States", nameAr: "الولايات المتحدة", flag: "🇺🇸", visaStatus: "visa_required" },
  { id: "tr", name: "Turkey", nameAr: "تركيا", flag: "🇹🇷", visaStatus: "e_visa" },
  { id: "ae", name: "United Arab Emirates", nameAr: "الإمارات العربية المتحدة", flag: "🇦🇪", visaStatus: "visa_free" },
  { id: "bh", name: "Bahrain", nameAr: "البحرين", flag: "🇧🇭", visaStatus: "visa_free" },
  { id: "eg", name: "Egypt", nameAr: "مصر", flag: "🇪🇬", visaStatus: "e_visa" },
  { id: "jp", name: "Japan", nameAr: "اليابان", flag: "🇯🇵", visaStatus: "visa_required" },
  { id: "my", name: "Malaysia", nameAr: "ماليزيا", flag: "🇲🇾", visaStatus: "visa_free" },
  { id: "in", name: "India", nameAr: "الهند", flag: "🇮🇳", visaStatus: "e_visa" },
  { id: "th", name: "Thailand", nameAr: "تايلاند", flag: "🇹🇭", visaStatus: "visa_free" },
  { id: "es", name: "Spain", nameAr: "إسبانيا", flag: "🇪🇸", visaStatus: "visa_required" },
  { id: "it", name: "Italy", nameAr: "إيطاليا", flag: "🇮🇹", visaStatus: "visa_required" },
  { id: "il", name: "Israel", nameAr: "إسرائيل", flag: "🇮🇱", visaStatus: "not_allowed" },
];

// Mock data for visa types
const mockVisaTypes: VisaType[] = [
  { id: "tourist", name: "Tourist Visa", nameAr: "تأشيرة سياحية" },
  { id: "business", name: "Business Visa", nameAr: "تأشيرة عمل" },
  { id: "student", name: "Student Visa", nameAr: "تأشيرة طالب" },
  { id: "medical", name: "Medical Visa", nameAr: "تأشيرة طبية" },
  { id: "transit", name: "Transit Visa", nameAr: "تأشيرة عبور" },
];

// Mock data for travelers (family members from Absher)
const mockTravelers: Traveler[] = [
  { id: "t1", name: "Mohammed Al-Rashid", nameAr: "محمد الراشد", relationship: "Self", relationshipAr: "نفسي", idNumber: "1085XXXXXX", passportExpiry: "2028-05-15", selected: false },
  { id: "t2", name: "Sara Al-Rashid", nameAr: "سارة الراشد", relationship: "Spouse", relationshipAr: "زوجة", idNumber: "1092XXXXXX", passportExpiry: "2027-08-20", selected: false },
  { id: "t3", name: "Ahmed Al-Rashid", nameAr: "أحمد الراشد", relationship: "Son", relationshipAr: "ابن", idNumber: "1118XXXXXX", passportExpiry: "2029-01-10", selected: false },
  { id: "t4", name: "Fatima Al-Rashid", nameAr: "فاطمة الراشد", relationship: "Daughter", relationshipAr: "ابنة", idNumber: "1120XXXXXX", passportExpiry: "2029-03-25", selected: false },
];

// Mock visa requirements
const mockRequirements: VisaRequirement[] = [
  { id: "r1", description: "Valid passport (at least 6 months validity)", descriptionAr: "جواز سفر ساري المفعول (6 أشهر على الأقل)", status: "available" },
  { id: "r2", description: "National ID card", descriptionAr: "بطاقة الهوية الوطنية", status: "available" },
  { id: "r3", description: "Travel insurance covering the entire stay", descriptionAr: "تأمين سفر يغطي كامل فترة الإقامة", status: "to_provide" },
  { id: "r4", description: "Flight booking / itinerary", descriptionAr: "حجز رحلة الطيران / خط سير الرحلة", status: "to_provide" },
  { id: "r5", description: "Hotel reservation or address of stay", descriptionAr: "حجز فندق أو عنوان الإقامة", status: "to_provide" },
  { id: "r6", description: "Bank statement (last 3 months)", descriptionAr: "كشف حساب بنكي (آخر 3 أشهر)", status: "available" },
  { id: "r7", description: "Employment letter", descriptionAr: "خطاب عمل", status: "available" },
  { id: "r8", description: "Passport-size photos (2 copies)", descriptionAr: "صور بحجم جواز السفر (نسختان)", status: "to_provide" },
];

// Mock embassy data
const mockEmbassies: Embassy[] = [
  {
    id: "fr-riyadh",
    countryId: "fr",
    name: "French Embassy",
    nameAr: "السفارة الفرنسية",
    city: "Riyadh",
    cityAr: "الرياض",
    hasIntegration: true,
    availableSlots: [
      { id: "s1", date: "2024-12-15", time: "09:00 AM", available: true },
      { id: "s2", date: "2024-12-15", time: "10:30 AM", available: true },
      { id: "s3", date: "2024-12-15", time: "02:00 PM", available: false },
      { id: "s4", date: "2024-12-16", time: "09:00 AM", available: true },
      { id: "s5", date: "2024-12-16", time: "11:00 AM", available: true },
      { id: "s6", date: "2024-12-17", time: "09:30 AM", available: true },
      { id: "s7", date: "2024-12-17", time: "02:30 PM", available: true },
      { id: "s8", date: "2024-12-18", time: "10:00 AM", available: false },
    ],
  },
  {
    id: "de-riyadh",
    countryId: "de",
    name: "German Embassy",
    nameAr: "السفارة الألمانية",
    city: "Riyadh",
    cityAr: "الرياض",
    hasIntegration: true,
    availableSlots: [
      { id: "s9", date: "2024-12-14", time: "08:30 AM", available: true },
      { id: "s10", date: "2024-12-14", time: "10:00 AM", available: true },
      { id: "s11", date: "2024-12-15", time: "09:00 AM", available: true },
      { id: "s12", date: "2024-12-15", time: "11:30 AM", available: true },
    ],
  },
  {
    id: "us-riyadh",
    countryId: "us",
    name: "U.S. Embassy",
    nameAr: "السفارة الأمريكية",
    city: "Riyadh",
    cityAr: "الرياض",
    hasIntegration: false,
    externalBookingUrl: "https://ustraveldocs.com/sa",
    availableSlots: [],
  },
  {
    id: "gb-riyadh",
    countryId: "gb",
    name: "British Embassy",
    nameAr: "السفارة البريطانية",
    city: "Riyadh",
    cityAr: "الرياض",
    hasIntegration: false,
    externalBookingUrl: "https://www.gov.uk/world/organisations/british-embassy-riyadh",
    availableSlots: [],
  },
];

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Country operations
  getCountries(): Promise<Country[]>;
  getCountry(id: string): Promise<Country | undefined>;

  // Visa type operations
  getVisaTypes(): Promise<VisaType[]>;
  getVisaType(id: string): Promise<VisaType | undefined>;

  // Traveler operations
  getTravelers(): Promise<Traveler[]>;
  getTraveler(id: string): Promise<Traveler | undefined>;

  // Requirements operations
  getRequirements(countryId: string, visaTypeId: string): Promise<VisaRequirement[]>;

  // Traveler document status
  getTravelerDocStatus(travelerIds: string[]): Promise<TravelerDocStatus[]>;

  // Embassy operations
  getEmbassy(countryId: string): Promise<Embassy | undefined>;

  // Visa request operations
  getVisaRequests(): Promise<VisaRequest[]>;
  getVisaRequest(id: string): Promise<VisaRequest | undefined>;
  createVisaRequest(request: InsertVisaRequest): Promise<VisaRequest>;
  updateVisaRequest(id: string, update: UpdateVisaRequest): Promise<VisaRequest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private visaRequests: Map<string, VisaRequest>;

  constructor() {
    this.users = new Map();
    this.visaRequests = new Map();

    // Add some sample previous requests
    const sampleRequest: VisaRequest = {
      id: "req-001",
      countryId: "ae",
      countryName: "United Arab Emirates",
      visaTypeId: "tourist",
      visaTypeName: "Tourist Visa",
      travelers: ["t1", "t2"],
      status: "completed",
      createdAt: "2024-11-15T10:30:00Z",
      appointmentDate: "2024-11-20",
      appointmentTime: "10:00 AM",
    };
    this.visaRequests.set(sampleRequest.id, sampleRequest);

    const draftRequest: VisaRequest = {
      id: "req-002",
      countryId: "tr",
      countryName: "Turkey",
      visaTypeId: "tourist",
      visaTypeName: "Tourist Visa",
      travelers: ["t1"],
      status: "draft",
      createdAt: "2024-12-01T14:00:00Z",
    };
    this.visaRequests.set(draftRequest.id, draftRequest);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Country operations
  async getCountries(): Promise<Country[]> {
    return mockCountries;
  }

  async getCountry(id: string): Promise<Country | undefined> {
    return mockCountries.find((c) => c.id === id);
  }

  // Visa type operations
  async getVisaTypes(): Promise<VisaType[]> {
    return mockVisaTypes;
  }

  async getVisaType(id: string): Promise<VisaType | undefined> {
    return mockVisaTypes.find((v) => v.id === id);
  }

  // Traveler operations
  async getTravelers(): Promise<Traveler[]> {
    return mockTravelers;
  }

  async getTraveler(id: string): Promise<Traveler | undefined> {
    return mockTravelers.find((t) => t.id === id);
  }

  // Requirements operations
  async getRequirements(countryId: string, visaTypeId: string): Promise<VisaRequirement[]> {
    // In real app, this would filter based on country and visa type
    return mockRequirements;
  }

  // Traveler document status
  async getTravelerDocStatus(travelerIds: string[]): Promise<TravelerDocStatus[]> {
    const travelers = mockTravelers.filter((t) => travelerIds.includes(t.id));
    
    return travelers.map((traveler, index) => ({
      travelerId: traveler.id,
      travelerName: traveler.name,
      relationship: traveler.relationship,
      status: index === 0 ? "ready" as const : "missing_items" as const,
      missingCount: index === 0 ? 0 : 2,
      requirements: mockRequirements.slice(0, 5),
    }));
  }

  // Embassy operations
  async getEmbassy(countryId: string): Promise<Embassy | undefined> {
    return mockEmbassies.find((e) => e.countryId === countryId) || {
      id: `${countryId}-default`,
      countryId,
      name: "Embassy",
      nameAr: "السفارة",
      city: "Riyadh",
      cityAr: "الرياض",
      hasIntegration: false,
      externalBookingUrl: "https://example.com",
      availableSlots: [],
    };
  }

  // Visa request operations
  async getVisaRequests(): Promise<VisaRequest[]> {
    return Array.from(this.visaRequests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getVisaRequest(id: string): Promise<VisaRequest | undefined> {
    return this.visaRequests.get(id);
  }

  async createVisaRequest(request: InsertVisaRequest): Promise<VisaRequest> {
    const country = await this.getCountry(request.countryId);
    const visaType = await this.getVisaType(request.visaTypeId);

    const id = `req-${randomUUID().slice(0, 8)}`;
    const newRequest: VisaRequest = {
      id,
      countryId: request.countryId,
      countryName: country?.name || "Unknown",
      visaTypeId: request.visaTypeId,
      visaTypeName: visaType?.name || "Unknown",
      travelers: request.travelers,
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    this.visaRequests.set(id, newRequest);
    return newRequest;
  }

  async updateVisaRequest(id: string, update: UpdateVisaRequest): Promise<VisaRequest | undefined> {
    const request = this.visaRequests.get(id);
    if (!request) return undefined;

    const updatedRequest: VisaRequest = {
      ...request,
      ...update,
    };

    this.visaRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();
