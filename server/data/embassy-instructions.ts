/**
 * Embassy-specific instructions for the success page.
 * Each country has its own set of next steps and requirements.
 */

export interface EmbassyInstructions {
  countryId: string;
  titleAr: string;
  titleEn: string;
  stepsAr: string[];
  stepsEn: string[];
  itemsToBringAr: string[];
  itemsToBringEn: string[];
  noteAr?: string;
  noteEn?: string;
  centerNameAr?: string;
  centerNameEn?: string;
  websiteUrl?: string;
}

// France VFS instructions
const FRANCE_INSTRUCTIONS: EmbassyInstructions = {
  countryId: "fr",
  titleAr: "ماذا أفعل الآن؟",
  titleEn: "What's next?",
  centerNameAr: "مركز طلبات تأشيرة فرنسا (VFS)",
  centerNameEn: "France Visa Application Center (VFS)",
  stepsAr: [
    "توجه إلى مركز طلبات تأشيرة فرنسا (VFS) في الموعد المحدد",
    "سيقوم الموظفون بمراجعة ملفك والتأكد من اكتمال المستندات",
    "سيتم أخذ بصماتك وصورتك الشخصية",
    "ستُدفع رسوم التأشيرة في المركز",
    "سيُحتفظ بجواز سفرك حتى صدور قرار السفارة",
  ],
  stepsEn: [
    "Go to the France Visa Application Center (VFS) on your scheduled date",
    "Staff will review your file and verify all documents are complete",
    "Your fingerprints and photo will be taken",
    "Visa fees will be collected at the center",
    "Your passport will be kept until the embassy makes a decision",
  ],
  itemsToBringAr: [
    "جواز السفر الأصلي",
    "بطاقة الهوية الوطنية",
    "نموذج الطلب مطبوعاً",
    "تأكيد الموعد مطبوعاً",
    "جميع المستندات التي جهّزناها لك",
  ],
  itemsToBringEn: [
    "Original passport",
    "National ID card",
    "Printed application form",
    "Printed appointment confirmation",
    "All documents we prepared for you",
  ],
  noteAr: "مدة المعالجة عادةً من 5 إلى 15 يوم عمل. ستصلك رسالة SMS عند جاهزية جوازك للاستلام.",
  noteEn: "Processing usually takes 5-15 business days. You'll receive an SMS when your passport is ready for collection.",
  websiteUrl: "https://fr.tlscontact.com/sa",
};

// Germany instructions
const GERMANY_INSTRUCTIONS: EmbassyInstructions = {
  countryId: "de",
  titleAr: "ماذا أفعل الآن؟",
  titleEn: "What's next?",
  centerNameAr: "السفارة الألمانية / مركز التأشيرات",
  centerNameEn: "German Embassy / Visa Center",
  stepsAr: [
    "توجه إلى السفارة الألمانية أو مركز التأشيرات في الموعد المحدد",
    "أحضر جميع المستندات الأصلية مع نسخ منها",
    "سيتم إجراء مقابلة قصيرة وأخذ البصمات",
    "ستُدفع رسوم التأشيرة",
    "سيُحتفظ بجواز سفرك للمعالجة",
  ],
  stepsEn: [
    "Go to the German Embassy or Visa Center on your scheduled date",
    "Bring all original documents with copies",
    "A short interview and fingerprinting will be conducted",
    "Visa fees will be collected",
    "Your passport will be kept for processing",
  ],
  itemsToBringAr: [
    "جواز السفر الأصلي",
    "بطاقة الهوية الوطنية",
    "تأكيد الموعد",
    "جميع المستندات المطلوبة",
    "صور شخصية حديثة",
  ],
  itemsToBringEn: [
    "Original passport",
    "National ID card",
    "Appointment confirmation",
    "All required documents",
    "Recent passport photos",
  ],
  noteAr: "مدة المعالجة عادةً من 10 إلى 15 يوم عمل.",
  noteEn: "Processing usually takes 10-15 business days.",
};

// Default instructions for countries without specific data
const DEFAULT_INSTRUCTIONS: EmbassyInstructions = {
  countryId: "default",
  titleAr: "ماذا أفعل الآن؟",
  titleEn: "What's next?",
  stepsAr: [
    "توجه إلى السفارة أو مركز التأشيرات في الموعد المحدد",
    "أحضر جميع المستندات الأصلية",
    "اتبع تعليمات موظفي المركز",
    "ستُدفع رسوم التأشيرة إن لم تكن مدفوعة مسبقاً",
  ],
  stepsEn: [
    "Go to the embassy or visa center on your scheduled date",
    "Bring all original documents",
    "Follow the instructions of the center staff",
    "Pay visa fees if not already paid",
  ],
  itemsToBringAr: [
    "جواز السفر الأصلي",
    "بطاقة الهوية الوطنية",
    "تأكيد الموعد",
    "جميع المستندات المطلوبة",
  ],
  itemsToBringEn: [
    "Original passport",
    "National ID card",
    "Appointment confirmation",
    "All required documents",
  ],
};

// Registry of all embassy instructions
const EMBASSY_INSTRUCTIONS_REGISTRY: Record<string, EmbassyInstructions> = {
  fr: FRANCE_INSTRUCTIONS,
  de: GERMANY_INSTRUCTIONS,
};

/**
 * Get embassy instructions for a specific country
 * Returns default instructions if country not found
 */
export function getEmbassyInstructions(countryId: string): EmbassyInstructions {
  const normalizedId = countryId.toLowerCase();
  return EMBASSY_INSTRUCTIONS_REGISTRY[normalizedId] || {
    ...DEFAULT_INSTRUCTIONS,
    countryId: normalizedId,
  };
}

