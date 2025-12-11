import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Check, ArrowLeft, FileText, CheckCircle, ChevronDown, ChevronUp, Sparkles, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCountryFields } from "@/hooks/use-country-fields";
import { DynamicFieldsForm, validateDynamicFields, type DynamicFieldValues } from "@/components/dynamic-fields";
import type { Country, TravelerDocStatus, VisaRequest, Traveler, DynamicField, AutoFillSource } from "@shared/schema";

// Helper to get Arabic label for government source
const getSourceLabel = (source?: AutoFillSource): string => {
  const labels: Record<AutoFillSource, string> = {
    absher_profile: "أبشر",
    absher_passport: "الجوازات",
    absher_family: "وزارة الداخلية",
    absher_travel_history: "الجوازات",
    gosi_employment: "التأمينات",
    spl_address: "البريد السعودي",
    ejar_residency: "إيجار",
  };
  return source ? labels[source] : "حكومي";
};

export default function Step2() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Dynamic field values and errors
  const [fieldValues, setFieldValues] = useState<DynamicFieldValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Collapsible state for traveler cards
  const [expandedTravelers, setExpandedTravelers] = useState<Set<string>>(new Set());
  
  const params = new URLSearchParams(search);
  const requestId = params.get("requestId") || "";

  const { data: request, isLoading: requestLoading } = useQuery<VisaRequest>({
    queryKey: ["/api/requests", requestId],
    enabled: !!requestId,
  });

  const { data: country, isLoading: countryLoading } = useQuery<Country>({
    queryKey: ["/api/countries", request?.countryId],
    enabled: !!request?.countryId,
  });

  const { data: travelerDocs, isLoading: travelersLoading } = useQuery<TravelerDocStatus[]>({
    queryKey: ["/api/traveler-docs", request?.travelers?.join(",")],
    enabled: !!request?.travelers && request.travelers.length > 0,
  });

  const { data: travelers } = useQuery<Traveler[]>({
    queryKey: ["/api/travelers"],
  });

  // Fetch country-specific dynamic fields
  const { data: countryFields } = useCountryFields(request?.countryId);

  // Separate shared vs per-traveler fields
  const { sharedFields, perTravelerFields, autoFilledFields } = useMemo(() => {
    if (!countryFields?.fields) return { sharedFields: [], perTravelerFields: [], autoFilledFields: [] };
    
    const shared: DynamicField[] = [];
    const perTraveler: DynamicField[] = [];
    const autoFilled: DynamicField[] = [];
    
    for (const field of countryFields.fields) {
      if (field.autoFillSource) {
        autoFilled.push(field);
      } else if (field.isShared) {
        shared.push(field);
      } else {
        perTraveler.push(field);
      }
    }
    
    return { sharedFields: shared, perTravelerFields: perTraveler, autoFilledFields: autoFilled };
  }, [countryFields?.fields]);

  const toggleTraveler = (id: string) => {
    const newSet = new Set(expandedTravelers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedTravelers(newSet);
  };

  const handleContinue = () => {
    // Validate dynamic fields if any exist
    const allFieldsToValidate = [...sharedFields, ...perTravelerFields];
    if (allFieldsToValidate.length > 0) {
      const errors = validateDynamicFields(allFieldsToValidate, fieldValues);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast({
          title: "بيانات ناقصة",
          description: "الرجاء ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }
    }
    setFieldErrors({});
    setLocation(`/step-3?requestId=${requestId}`);
  };

  const isLoading = requestLoading || countryLoading || travelersLoading;

  if (!requestId) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header />
        <main className="max-w-[1200px] mx-auto px-5 py-8">
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="p-8 text-center">
              <p className="text-[#707070]">لم يتم العثور على طلب تأشيرة. الرجاء البدء من البداية.</p>
              <Link href="/step-1">
                <button className="mt-4 bg-[#00ab67] hover:bg-[#008550] text-white py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer transition-all">بدء طلب جديد</button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getCountryFlag = (countryId: string) => `https://flagcdn.com/w40/${countryId}.png`;
  const getTravelerInitial = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 1);
  const getTravelerName = (travelerId: string) => travelers?.find(t => t.id === travelerId)?.nameAr || '';

  // Count available docs for a traveler
  const getAvailableDocsCount = (doc: TravelerDocStatus) => 
    doc.requirements.filter(r => r.status === 'available').length;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <main className="py-8 min-h-[70vh]">
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Progress Steps */}
          <div className="flex justify-center gap-[60px] mb-8 bg-white py-6 px-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00ab67] text-white flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <div className="font-medium text-[#333]">البيانات الأساسية</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00ab67] text-white flex items-center justify-center font-bold">2</div>
              <div className="font-medium text-[#333]">المتطلبات</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e0e0e0] text-[#707070] flex items-center justify-center font-bold">3</div>
              <div className="font-medium text-[#707070]">حجز الموعد</div>
            </div>
          </div>

          {isLoading ? (
            <>
              <div className="h-24 w-full mb-5 rounded-xl bg-[#e0e0e0] animate-pulse" />
              <div className="h-64 w-full mb-5 rounded-xl bg-[#e0e0e0] animate-pulse" />
            </>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-[#f8fdf9] to-[#e8f5e9] border-2 border-[#00ab67] rounded-xl p-5 mb-6">
                <div className="flex justify-between py-2.5 border-b border-[#00ab67]/20">
                  <span className="text-[#707070] text-sm">الوجهة</span>
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <img src={getCountryFlag(country?.id || '')} alt={country?.name} className="w-6 h-4 rounded" />
                    {country?.nameAr}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[#707070] text-sm">المسافرون</span>
                  <span className="font-semibold text-sm">
                    {request?.travelers.map(id => getTravelerName(id)).join('، ')}
                  </span>
                </div>
              </div>

              {/* Auto-filled Documents from Absher */}
              {(travelerDocs && travelerDocs.length > 0) && (
                <div className="bg-white rounded-xl border-2 border-[#e0e0e0] mb-6 overflow-hidden">
                  <div className="bg-gradient-to-l from-[#00ab67]/5 to-transparent p-4 border-b border-[#e0e0e0]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#00ab67]/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#00ab67]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-[#333]">مستندات جاهزة من أبشر</h3>
                        <p className="text-[12px] text-[#707070]">تم استخراجها تلقائياً من سجلاتك الحكومية</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-[#f0f0f0]">
                    {travelerDocs.map((doc) => {
                      const traveler = travelers?.find(t => t.id === doc.travelerId);
                      const availableReqs = doc.requirements.filter(r => r.status === 'available');
                      const isExpanded = expandedTravelers.has(doc.travelerId);
                      
                      if (availableReqs.length === 0) return null;
                      
                      return (
                        <div key={doc.travelerId}>
                          {/* Traveler Header - Clickable */}
                          <button
                            onClick={() => toggleTraveler(doc.travelerId)}
                            className="w-full p-4 flex items-center justify-between hover:bg-[#f8f9fa] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00cc7b] to-[#00ab67] flex items-center justify-center text-white font-bold text-sm">
                                {traveler ? getTravelerInitial(traveler.nameAr) : '?'}
                              </div>
                              <div className="text-right">
                                <h4 className="font-semibold text-[14px]">{doc.travelerName}</h4>
                                <span className="text-[12px] text-[#707070]">{doc.relationship}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-[#00ab67]">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-[13px] font-medium">{availableReqs.length} مستند</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-[#707070]" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-[#707070]" />
                              )}
                            </div>
                          </button>
                          
                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0">
                              <div className="bg-[#f8fdf9] rounded-lg p-3 space-y-2">
                                {availableReqs.map((req) => (
                                  <div key={req.id} className="flex items-center gap-2.5 text-[13px]">
                                    <CheckCircle className="w-4 h-4 text-[#00ab67] flex-shrink-0" />
                                    <span className="text-[#333]">{req.descriptionAr}</span>
                                    <span className="mr-auto text-[11px] text-[#00ab67] bg-[#00ab67]/10 px-2 py-0.5 rounded-full">
                                      من أبشر
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auto-filled Embassy Fields */}
              {autoFilledFields.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-[#e0e0e0] mb-6 overflow-hidden">
                  <div className="bg-gradient-to-l from-[#00ab67]/5 to-transparent p-4 border-b border-[#e0e0e0]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#00ab67]/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#00ab67]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-[#333]">مستندات حكومية جاهزة</h3>
                        <p className="text-[12px] text-[#707070]">مستخرجة تلقائياً من الجهات الحكومية</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="bg-[#f8fdf9] rounded-lg p-3 space-y-2.5">
                      {autoFilledFields.map((field) => (
                        <div key={field.fieldKey} className="flex items-center gap-2.5 text-[13px]">
                          <CheckCircle className="w-4 h-4 text-[#00ab67] flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-[#333]">{field.labelAr}</span>
                            {field.noteAr && (
                              <p className="text-[11px] text-[#707070] mt-0.5">{field.noteAr}</p>
                            )}
                          </div>
                          <span className="text-[11px] text-[#00ab67] bg-[#00ab67]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {getSourceLabel(field.autoFillSource)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Fields - Trip Details */}
              {sharedFields.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-[#e0e0e0] mb-6 overflow-hidden">
                  <div className="p-4 border-b border-[#e0e0e0]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#2196f3]/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#2196f3]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-[#333]">معلومات الرحلة</h3>
                        <p className="text-[12px] text-[#707070]">مشتركة لجميع المسافرين</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <DynamicFieldsForm
                      fields={sharedFields}
                      values={fieldValues}
                      onChange={setFieldValues}
                      errors={fieldErrors}
                    />
                  </div>
                </div>
              )}

              {/* Per-Traveler Fields */}
              {perTravelerFields.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-[#e0e0e0] mb-6 overflow-hidden">
                  <div className="p-4 border-b border-[#e0e0e0]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#ff9800]/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#ff9800]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-[#333]">مستندات شخصية</h3>
                        <p className="text-[12px] text-[#707070]">مطلوبة من كل مسافر</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <DynamicFieldsForm
                      fields={perTravelerFields}
                      values={fieldValues}
                      onChange={setFieldValues}
                      errors={fieldErrors}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#e0e0e0]">
                <Link href="/step-1">
                  <button className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold cursor-pointer transition-all">
                    رجوع
                  </button>
                </Link>
                
                <button
                  onClick={handleContinue}
                  className="bg-[#00ab67] hover:bg-[#008550] text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold inline-flex items-center gap-2.5 cursor-pointer transition-all"
                >
                  حجز الموعد
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
