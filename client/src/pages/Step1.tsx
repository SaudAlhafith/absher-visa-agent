import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { WorldMap } from "@/components/WorldMap";
import { Search, ArrowLeft, Globe, Users, Check, Clock, ExternalLink, AlertCircle, Info, Map, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Country, Traveler, VisaApiResponse } from "@shared/schema";

interface VisaMapResponse {
  data: {
    passport: string;
    colors: {
      red?: string;
      green?: string;
      blue?: string;
      yellow?: string;
    };
  };
  meta: { version: string; language: string; generated_at: string; };
}

export default function Step1() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedTravelers, setSelectedTravelers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"map" | "list">("list");

  const { data: countries, isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  // Fetch visa map colors for the world map
  const { data: visaMapData } = useQuery<VisaMapResponse>({
    queryKey: ["/api/visa-map"],
  });

  const { data: travelers, isLoading: travelersLoading } = useQuery<Traveler[]>({
    queryKey: ["/api/travelers"],
  });

  // Fetch visa info when a country is selected
  const { data: visaInfo, isLoading: visaInfoLoading, error: visaInfoError } = useQuery<VisaApiResponse>({
    queryKey: ["/api/visa-info", selectedCountry?.id?.toUpperCase()],
    enabled: !!selectedCountry,
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/requests", {
        countryId: selectedCountry!.id,
        travelers: Array.from(selectedTravelers),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setLocation(`/step-2?requestId=${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create visa request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(query) || c.nameAr.includes(query)
    );
  }, [countries, searchQuery]);

  const toggleTraveler = (id: string) => {
    const newSelected = new Set(selectedTravelers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTravelers(newSelected);
  };

  const canContinue = selectedCountry && 
    selectedCountry.visaStatus !== "not_allowed" && 
    selectedTravelers.size > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    createRequestMutation.mutate();
  };

  const getCountryFlag = (countryId: string) => {
    return `https://flagcdn.com/w80/${countryId}.png`;
  };

  // Consistent color styles for visa status
  const STATUS_STYLES = {
    green: "bg-[#e8f5e9] text-[#2e7d32]",      // Visa free
    blue: "bg-[#e3f2fd] text-[#1565c0]",       // eVisa / Visa on arrival
    yellow: "bg-[#fff8e1] text-[#f57f17]",     // eTA
    red: "bg-[#ffebee] text-[#c62828]",        // Visa required
  };

  // Convert API color to status info (for visa info panel)
  const getVisaStatusFromColor = (color: string) => {
    const colorMap: Record<string, { text: string; textAr: string; class: string }> = {
      green: { text: "Visa Free", textAr: "بدون تأشيرة", class: STATUS_STYLES.green },
      blue: { text: "Visa on Arrival / eVisa", textAr: "تأشيرة عند الوصول / إلكترونية", class: STATUS_STYLES.blue },
      yellow: { text: "eTA Required", textAr: "تصريح سفر إلكتروني مطلوب", class: STATUS_STYLES.yellow },
      red: { text: "Visa Required", textAr: "تأشيرة مطلوبة", class: STATUS_STYLES.red },
    };
    return colorMap[color] || colorMap.red;
  };

  // Get visa status label (for country cards)
  const getVisaStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; class: string }> = {
      visa_required: { text: "تأشيرة مطلوبة", class: STATUS_STYLES.red },
      e_visa: { text: "تأشيرة إلكترونية", class: STATUS_STYLES.blue },
      visa_free: { text: "بدون تأشيرة", class: STATUS_STYLES.green },
      not_allowed: { text: "غير مسموح", class: "bg-[#424242] text-white" },
    };
    return labels[status] || labels.visa_required;
  };

  // Translate API terms to Arabic
  const translateToArabic = (text: string): string => {
    const translations: Record<string, string> = {
      // Visa rules
      "Visa required": "تأشيرة مطلوبة",
      "Visa on arrival": "تأشيرة عند الوصول",
      "eVisa": "تأشيرة إلكترونية",
      "Visa-free": "بدون تأشيرة",
      "Visa not required": "بدون تأشيرة",
      "eTA": "تصريح سفر إلكتروني",
      "Freedom of movement": "حرية التنقل",
      "Not admitted": "غير مسموح بالدخول",
      "Tourist card": "بطاقة سياحية",
      "Online visa required": "تأشيرة إلكترونية مطلوبة",
      // Registration
      "e-Arrival": "التسجيل الإلكتروني للوصول",
      "pre-registration": "التسجيل المسبق",
      "ED card": "بطاقة الوصول",
      // Passport validity - common patterns
      "6 months": "٦ أشهر",
      "3 months": "٣ أشهر",
      "Valid on arrival": "ساري عند الوصول",
      "Valid for period of stay": "ساري لفترة الإقامة",
      "Valid at time of entry": "ساري وقت الدخول",
      "6 months beyond the period of stay": "٦ أشهر بعد فترة الإقامة",
      "3 months beyond the period of stay": "٣ أشهر بعد فترة الإقامة",
      "6 months longer than the duration of stay": "٦ أشهر أطول من مدة الإقامة",
      "3 months longer than the duration of stay": "٣ أشهر أطول من مدة الإقامة",
      "6 months from date of entry": "٦ أشهر من تاريخ الدخول",
      "3 months from date of entry": "٣ أشهر من تاريخ الدخول",
      "6 months beyond date of entry": "٦ أشهر بعد تاريخ الدخول",
      "3 months beyond date of entry": "٣ أشهر بعد تاريخ الدخول",
    };
    
    // Check exact match first
    if (translations[text]) return translations[text];
    
    // Try to translate duration patterns like "30 days", "90 days"
    const durationMatch = text.match(/^(\d+)\s*(days?|months?|years?)$/i);
    if (durationMatch) {
      const num = durationMatch[1];
      const unit = durationMatch[2].toLowerCase();
      const arabicUnits: Record<string, string> = {
        day: "يوم", days: "يوم",
        month: "شهر", months: "شهر",
        year: "سنة", years: "سنة",
      };
      return `${num} ${arabicUnits[unit] || unit}`;
    }
    
    // Handle "X months longer/beyond..." patterns
    const validityMatch = text.match(/^(\d+)\s*months?\s+(longer than|beyond|from)/i);
    if (validityMatch) {
      const num = validityMatch[1];
      const rest = text.substring(validityMatch[0].length).trim();
      const restTranslations: Record<string, string> = {
        "the duration of stay": "من مدة الإقامة",
        "the period of stay": "من فترة الإقامة",
        "date of entry": "من تاريخ الدخول",
        "arrival": "من الوصول",
      };
      for (const [en, ar] of Object.entries(restTranslations)) {
        if (rest.toLowerCase().includes(en)) {
          return `${num} شهر ${ar}`;
        }
      }
    }
    
    return text;
  };

  // Get combined visa rule display text in Arabic
  const getVisaRuleDisplay = () => {
    if (!visaInfo?.data?.visa_rules) return null;
    const { primary_rule, secondary_rule } = visaInfo.data.visa_rules;
    
    let ruleText = translateToArabic(primary_rule.name);
    if (secondary_rule) {
      ruleText += ` / ${translateToArabic(secondary_rule.name)}`;
    }
    
    const duration = primary_rule.duration || secondary_rule?.duration;
    if (duration) {
      ruleText += ` – ${translateToArabic(duration)}`;
    }
    
    return ruleText;
  };

  const getTravelerInitial = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 1);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <main className="py-8 min-h-[70vh]">
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Progress Steps */}
          <div className="flex justify-center gap-[60px] mb-8 bg-white py-6 px-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00ab67] text-white flex items-center justify-center font-bold">1</div>
              <div className="font-medium text-[#333]">البيانات الأساسية</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e0e0e0] text-[#707070] flex items-center justify-center font-bold">2</div>
              <div className="font-medium text-[#707070]">المتطلبات</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e0e0e0] text-[#707070] flex items-center justify-center font-bold">3</div>
              <div className="font-medium text-[#707070]">حجز الموعد</div>
            </div>
          </div>

          {/* Country Selection with Map/List Toggle */}
          <div id="country-selection" className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
            {/* Header with Toggle */}
            <div className="bg-gradient-to-br from-[#00ab67] to-[#008550] text-white py-[18px] px-[25px] flex items-center justify-between">
              <div className="text-[17px] font-bold flex items-center gap-3">
                <Globe className="w-5 h-5" />
                اختر الدولة
              </div>
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                    viewMode === "map"
                      ? "bg-white text-[#00ab67]"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <Map className="w-4 h-4" />
                  خريطة
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                    viewMode === "list"
                      ? "bg-white text-[#00ab67]"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <List className="w-4 h-4" />
                  قائمة
                </button>
              </div>
            </div>

            <div className="p-[25px]">
              {/* Map View */}
              {viewMode === "map" && (
                visaMapData?.data?.colors ? (
                  <WorldMap
                    visaColors={visaMapData.data.colors}
                    onCountryClick={(code) => {
                      const country = countries?.find(c => c.id === code);
                      if (country) {
                        setSelectedCountry(country);
                      }
                    }}
                    selectedCountry={selectedCountry?.id}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[400px] bg-[#f8fafc] rounded-xl border-2 border-[#e0e0e0]">
                    <div className="text-center">
                      <div className="w-8 h-8 border-3 border-[#00ab67] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-[#707070] text-[14px]">جاري تحميل الخريطة...</p>
                    </div>
                  </div>
                )
              )}

              {/* List View */}
              {viewMode === "list" && (
                <>
                  <div className="relative mb-5">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
                    <input
                      type="search"
                      placeholder="ابحث عن دولة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-11 py-3.5 px-5 border-2 border-[#e0e0e0] rounded-[10px] text-[15px] focus:outline-none focus:border-[#00ab67]"
                      data-testid="input-search-country"
                    />
                  </div>

                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    {countriesLoading ? (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-16 w-full rounded-[10px] bg-[#e0e0e0] animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                        {filteredCountries.map((country) => {
                          const statusInfo = getVisaStatusLabel(country.visaStatus);
                          return (
                            <div
                              key={country.id}
                              onClick={() => setSelectedCountry(country)}
                              className={`flex items-center gap-3 p-[15px] border-2 rounded-[10px] cursor-pointer transition-all ${
                                selectedCountry?.id === country.id
                                  ? "border-[#00ab67] bg-[#e8f5e9]"
                                  : "border-[#e0e0e0] hover:border-[#00ab67] hover:bg-[#f8fdf9]"
                              }`}
                            >
                              <img
                                src={getCountryFlag(country.id)}
                                alt={country.name}
                                className="w-9 h-[27px] rounded-[3px] object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-[15px] mb-[3px]">{country.nameAr}</h4>
                                <span className={`text-[11px] px-2 py-0.5 rounded-[10px] ${statusInfo.class}`}>
                                  {statusInfo.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Visa Info Panel - Shows when a country is selected */}
              {selectedCountry && (
                <div className="mt-5 border-t-2 border-[#e0e0e0] pt-5">
                  {visaInfoLoading ? (
                    <div className="flex items-center gap-3 text-[#707070]">
                      <div className="w-5 h-5 border-2 border-[#00ab67] border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري جلب معلومات التأشيرة...</span>
                    </div>
                  ) : visaInfoError ? (
                    <div className="flex items-center gap-3 text-[#c62828] bg-[#ffebee] p-4 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span>تعذر جلب معلومات التأشيرة. يرجى المحاولة مرة أخرى.</span>
                    </div>
                  ) : visaInfo?.data ? (
                    <div className="bg-[#f8fdf9] border-2 border-[#00ab67] rounded-xl p-5">
                      <h3 className="font-bold text-[16px] text-[#333] mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-[#00ab67]" />
                        معلومات التأشيرة لـ {selectedCountry?.nameAr || selectedCountry?.name}
                      </h3>
                      
                      {/* Primary Visa Rule */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1.5 rounded-lg text-[13px] font-medium ${getVisaStatusFromColor(visaInfo.data.visa_rules.primary_rule.color).class}`}>
                            {translateToArabic(visaInfo.data.visa_rules.primary_rule.name)}
                          </span>
                          {visaInfo.data.visa_rules.primary_rule.duration && (
                            <span className="flex items-center gap-1.5 text-[#707070] text-[13px]">
                              <Clock className="w-4 h-4" />
                              {translateToArabic(visaInfo.data.visa_rules.primary_rule.duration)}
                            </span>
                          )}
                        </div>
                        
                        {/* Combined Rule Display */}
                        <p className="text-[14px] text-[#333] font-medium">
                          {getVisaRuleDisplay()}
                        </p>
                      </div>

                      {/* Secondary Rule with Link */}
                      {visaInfo.data.visa_rules.secondary_rule?.link && (
                        <a
                          href={visaInfo.data.visa_rules.secondary_rule.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#1565c0] hover:text-[#0d47a1] text-[13px] mb-4"
                        >
                          <ExternalLink className="w-4 h-4" />
                          تقديم طلب {translateToArabic(visaInfo.data.visa_rules.secondary_rule.name)}
                        </a>
                      )}

                      {/* Mandatory Registration */}
                      {visaInfo.data.mandatory_registration && (
                        <div className="mt-4 p-3 bg-[#fff3e0] rounded-lg border border-[#ffcc80]">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-[#e65100]" />
                            <span className="font-medium text-[#e65100] text-[13px]">
                              تسجيل إلزامي: {translateToArabic(visaInfo.data.mandatory_registration.name)}
                            </span>
                          </div>
                          {visaInfo.data.mandatory_registration.link && (
                            <a
                              href={visaInfo.data.mandatory_registration.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#e65100] hover:text-[#bf360c] text-[12px]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              إكمال التسجيل
                            </a>
                          )}
                        </div>
                      )}

                      {/* Destination Info */}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-[#707070]">
                        {visaInfo.data.destination.passport_validity && (
                          <div>
                            <span className="font-medium text-[#333]">صلاحية الجواز: </span>
                            {translateToArabic(visaInfo.data.destination.passport_validity)}
                          </div>
                        )}
                        {visaInfo.data.destination.currency && (
                          <div>
                            <span className="font-medium text-[#333]">العملة: </span>
                            {visaInfo.data.destination.currency}
                          </div>
                        )}
                      </div>

                     
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Travelers Selection */}
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
            <div className="bg-gradient-to-br from-[#00ab67] to-[#008550] text-white py-[18px] px-[25px] text-[17px] font-bold flex items-center gap-3">
              <Users className="w-5 h-5" />
              المسافرون
            </div>
            <div className="p-[25px]">
              {travelersLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 w-full rounded-[10px] bg-[#e0e0e0] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div>
                  {travelers?.map((traveler) => {
                    const isSelected = selectedTravelers.has(traveler.id);
                    return (
                      <div
                        key={traveler.id}
                        onClick={() => toggleTraveler(traveler.id)}
                        className={`flex items-center justify-between p-[15px] border-2 rounded-[10px] cursor-pointer transition-all mb-2.5 last:mb-0 ${
                          isSelected
                            ? "border-[#00ab67] bg-[#f8fdf9]"
                            : "border-[#e0e0e0]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00cc7b] to-[#00ab67] flex items-center justify-center text-white font-bold">
                            {getTravelerInitial(traveler.nameAr)}
                          </div>
                          <div>
                            <h4 className="font-semibold mb-[3px]">{traveler.nameAr}</h4>
                            <span className="text-[13px] text-[#707070]">
                              {traveler.relationshipAr} • {traveler.idNumber}
                            </span>
                          </div>
                        </div>
                        <div className={`w-[22px] h-[22px] border-2 rounded flex items-center justify-center ${
                          isSelected
                            ? "bg-[#00ab67] border-[#00ab67] text-white"
                            : "border-[#e0e0e0]"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#e0e0e0]">
            <Link href="/">
              <button
                className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold cursor-pointer transition-all"
                data-testid="button-back"
              >
                رجوع
              </button>
            </Link>
            
            <button
              onClick={handleContinue}
              disabled={!canContinue || createRequestMutation.isPending}
              className="bg-[#00ab67] hover:bg-[#008550] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold inline-flex items-center gap-2.5 cursor-pointer transition-all"
              data-testid="button-continue"
            >
              {createRequestMutation.isPending ? (
                "جاري المعالجة..."
              ) : (
                <>
                  التالي
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
