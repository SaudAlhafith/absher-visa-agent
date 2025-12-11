/**
 * Country-specific dynamic fields for visa applications.
 * Each country can have custom fields required by their embassy.
 * Countries not listed here will return an empty array.
 */

import type { CountryFields, DynamicField } from "@shared/schema";

// France visa application fields
const FRANCE_FIELDS: DynamicField[] = [
  // === SHARED FIELDS (one entry for all travelers) ===
  {
    fieldKey: "travel_purpose",
    kind: "FIELD",
    dataType: "ENUM",
    labelEn: "Purpose of travel",
    labelAr: "غرض السفر",
    mandatory: true,
    isShared: true,
    options: [
      { value: "tourism", labelEn: "Tourism", labelAr: "سياحة" },
      { value: "family_visit", labelEn: "Family visit", labelAr: "زيارة عائلية" },
      { value: "business", labelEn: "Business", labelAr: "أعمال" },
      { value: "medical", labelEn: "Medical treatment", labelAr: "علاج طبي" },
      { value: "education", labelEn: "Education / Study", labelAr: "تعليم / دراسة" },
      { value: "other", labelEn: "Other", labelAr: "أخرى" },
    ],
  },
  {
    fieldKey: "travel_itinerary",
    kind: "FIELD",
    dataType: "TEXT",
    labelEn: "Travel itinerary (cities & dates)",
    labelAr: "خطة السفر (المدن والتواريخ)",
    mandatory: true,
    isShared: true,
    noteEn: "Briefly describe your planned cities and dates",
    noteAr: "صف بإيجاز المدن والتواريخ المخطط لها",
  },
  {
    fieldKey: "flight_reservation",
    kind: "ATTACHMENT",
    labelEn: "Flight reservation (round trip)",
    labelAr: "حجز تذاكر السفر (ذهاب وعودة)",
    mandatory: true,
    isShared: true,
    noteEn: "Upload round-trip flight booking confirmation",
    noteAr: "ارفع تأكيد حجز الطيران ذهاباً وإياباً",
  },
  {
    fieldKey: "accommodation_proof",
    kind: "ATTACHMENT",
    labelEn: "Proof of accommodation",
    labelAr: "إثبات مكان الإقامة",
    mandatory: true,
    isShared: true,
    noteEn: "Hotel booking, rental agreement, or host invitation letter",
    noteAr: "حجز فندق، عقد إيجار، أو خطاب دعوة من المضيف",
  },
  {
    fieldKey: "travel_medical_insurance",
    kind: "ATTACHMENT",
    labelEn: "Travel medical insurance",
    labelAr: "التأمين الطبي للسفر",
    mandatory: true,
    isShared: true,
    noteEn: "Insurance covering Schengen area with minimum €30,000 coverage",
    noteAr: "تأمين يغطي منطقة شنغن بحد أدنى 30,000 يورو",
  },
  // === AUTO-FILLED FROM GOVERNMENT SYSTEMS ===
  {
    fieldKey: "family_registry",
    kind: "ATTACHMENT",
    labelEn: "Family Registry (Household Register)",
    labelAr: "سجل الأسرة (بطاقة العائلة)",
    mandatory: true,
    autoFillSource: "absher_family",
    noteEn: "Family card showing marital status and dependents",
    noteAr: "بطاقة العائلة توضح الحالة الاجتماعية والمعالين - من وزارة الداخلية",
  },
  {
    fieldKey: "travel_history",
    kind: "ATTACHMENT",
    labelEn: "Travel History Report",
    labelAr: "تقرير سجل السفر (الدخول والخروج)",
    mandatory: true,
    autoFillSource: "absher_travel_history",
    noteEn: "Official entry/exit movements record",
    noteAr: "سجل حركات الدخول والخروج الرسمي - من الجوازات",
  },
  {
    fieldKey: "employment_record",
    kind: "ATTACHMENT",
    labelEn: "Employment & Salary Certificate",
    labelAr: "شهادة العمل والراتب",
    mandatory: true,
    autoFillSource: "gosi_employment",
    noteEn: "Employment record from social insurance",
    noteAr: "سجل التوظيف والراتب - من التأمينات الاجتماعية",
  },
  // === MANUAL UPLOAD (shared - from head of family) ===
  {
    fieldKey: "bank_statements",
    kind: "ATTACHMENT",
    labelEn: "Bank statements (recent)",
    labelAr: "كشوفات الحساب البنكي الحديثة",
    mandatory: true,
    isShared: true,
    isRepeatable: true,
    noteEn: "Last 3-6 months bank statements from head of family",
    noteAr: "كشوفات آخر 3-6 أشهر من رب الأسرة تُظهر كفاية الرصيد",
  },
];

// Registry of all country fields
const COUNTRY_FIELDS_REGISTRY: Record<string, DynamicField[]> = {
  fr: FRANCE_FIELDS,
  // Add more countries here as needed:
  // de: GERMANY_FIELDS,
  // it: ITALY_FIELDS,
};

/**
 * Get dynamic fields for a specific country
 * Returns empty array if country has no custom fields
 */
export function getCountryFields(countryId: string): CountryFields {
  const normalizedId = countryId.toLowerCase();
  return {
    countryId: normalizedId,
    fields: COUNTRY_FIELDS_REGISTRY[normalizedId] || [],
  };
}

/**
 * Check if a country has custom fields
 */
export function hasCountryFields(countryId: string): boolean {
  return countryId.toLowerCase() in COUNTRY_FIELDS_REGISTRY;
}
