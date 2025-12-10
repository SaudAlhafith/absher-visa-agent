import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Check, ArrowLeft, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Country, VisaType, VisaRequirement, TravelerDocStatus, VisaRequest, Traveler } from "@shared/schema";

export default function Step2() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
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

  const { data: visaType, isLoading: visaTypeLoading } = useQuery<VisaType>({
    queryKey: ["/api/visa-types", request?.visaTypeId],
    enabled: !!request?.visaTypeId,
  });

  const { data: requirements, isLoading: requirementsLoading } = useQuery<VisaRequirement[]>({
    queryKey: ["/api/requirements", request?.countryId, request?.visaTypeId],
    enabled: !!request?.countryId && !!request?.visaTypeId,
  });

  const { data: travelerDocs, isLoading: travelersLoading } = useQuery<TravelerDocStatus[]>({
    queryKey: ["/api/traveler-docs", request?.travelers?.join(",")],
    enabled: !!request?.travelers && request.travelers.length > 0,
  });

  const { data: travelers } = useQuery<Traveler[]>({
    queryKey: ["/api/travelers"],
  });

  const handlePreviewPdf = (travelerId: string) => {
    toast({
      title: "PDF Preview",
      description: `Opening PDF pack preview for traveler...`,
    });
  };

  const handleDownloadAll = () => {
    toast({
      title: "Downloading PDFs",
      description: "Your document pack is being prepared for download.",
    });
  };

  const handleContinue = () => {
    setLocation(`/step-3?requestId=${requestId}`);
  };

  const isLoading = requestLoading || countryLoading || visaTypeLoading || requirementsLoading || travelersLoading;

  if (!requestId) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header />
        <main className="max-w-[1200px] mx-auto px-5 py-8">
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="p-8 text-center">
              <p className="text-[#707070]" data-testid="text-no-request">لم يتم العثور على طلب تأشيرة. الرجاء البدء من البداية.</p>
              <Link href="/step-1">
                <button className="mt-4 bg-[#00ab67] hover:bg-[#008550] text-white py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer transition-all" data-testid="button-restart">بدء طلب جديد</button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getCountryFlag = (countryId: string) => {
    return `https://flagcdn.com/w40/${countryId}.png`;
  };

  const getTravelerInitial = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 1);
  };

  const getTravelerName = (travelerId: string) => {
    return travelers?.find(t => t.id === travelerId)?.nameAr || '';
  };

  const getTravelerRelationship = (travelerId: string) => {
    return travelers?.find(t => t.id === travelerId)?.relationshipAr || '';
  };

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
              <div className="h-48 w-full mb-5 rounded-xl bg-[#e0e0e0] animate-pulse" />
            </>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-[#f8fdf9] to-[#e8f5e9] border-2 border-[#00ab67] rounded-xl p-5 mb-5">
                <div className="flex justify-between py-2.5 border-b border-[#00ab67]/20 last:border-b-0">
                  <span className="text-[#707070] text-sm">الوجهة</span>
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <img src={getCountryFlag(country?.id || '')} alt={country?.name} className="w-6 h-4 rounded" />
                    {country?.nameAr} - {visaType?.nameAr}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[#707070] text-sm">المسافرون</span>
                  <span className="font-semibold text-sm">
                    {request?.travelers.map(id => getTravelerName(id)).join('، ')}
                  </span>
                </div>
              </div>

              {/* Traveler Requirement Cards */}
              {travelerDocs?.map((doc) => {
                const traveler = travelers?.find(t => t.id === doc.travelerId);
                const availableReqs = doc.requirements.filter(r => r.status === 'available');
                const neededReqs = doc.requirements.filter(r => r.status === 'to_provide' || r.status === 'missing');
                
                return (
                  <div key={doc.travelerId} className="border-2 border-[#e0e0e0] rounded-xl mb-5 overflow-hidden">
                    <div className="bg-[#f8f9fa] p-4 flex items-center justify-between border-b border-[#e0e0e0]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00cc7b] to-[#00ab67] flex items-center justify-center text-white font-bold">
                          {traveler ? getTravelerInitial(traveler.nameAr) : '?'}
                        </div>
                        <div>
                          <h4 className="font-semibold">{doc.travelerName}</h4>
                          <span className="text-xs text-[#707070]">{doc.relationship}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 font-semibold text-sm ${
                        doc.status === 'ready' ? 'text-[#51a041]' : 'text-[#f7941d]'
                      }`}>
                        {doc.status === 'ready' ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            جاهز
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            ينقص {doc.missingCount} مستند
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {availableReqs.length > 0 && (
                        <div className="mb-4 last:mb-0">
                          <div className="font-semibold text-sm mb-2.5 flex items-center gap-2 text-[#51a041]">
                            <CheckCircle className="w-4 h-4" />
                            مستندات متوفرة من أبشر
                          </div>
                          <div className="grid gap-2">
                            {availableReqs.map((req) => (
                              <div key={req.id} className="flex items-center gap-2.5 py-2.5 px-3 bg-[#f8f9fa] rounded-md text-sm">
                                <CheckCircle className="w-4 h-4 text-[#51a041]" />
                                {req.descriptionAr}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {neededReqs.length > 0 && (
                        <div className="mb-4 last:mb-0">
                          <div className="font-semibold text-sm mb-2.5 flex items-center gap-2 text-[#f7941d]">
                            <AlertCircle className="w-4 h-4" />
                            مستندات مطلوب توفيرها
                          </div>
                          <div className="grid gap-2">
                            {neededReqs.map((req) => (
                              <div key={req.id} className="flex items-center gap-2.5 py-2.5 px-3 bg-[#f8f9fa] rounded-md text-sm">
                                <AlertCircle className="w-4 h-4 text-[#f7941d]" />
                                {req.descriptionAr}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        className="w-full mt-4 border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer transition-all inline-flex items-center justify-center gap-2"
                        onClick={() => handlePreviewPdf(doc.travelerId)}
                      >
                        <FileText className="w-4 h-4" />
                        معاينة ملف PDF
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Info Box */}
              <div className="bg-[#e3f2fd] border-r-4 border-[#247cd6] p-3 px-4 rounded-md mb-5 flex items-center gap-2.5 text-sm text-[#1565c0]">
                <Info className="w-4 h-4" />
                جميع البيانات مستخرجة من سجلاتك الحكومية في أبشر
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#e0e0e0]">
                <Link href="/step-1">
                  <button
                    className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold cursor-pointer transition-all"
                    data-testid="button-back"
                  >
                    رجوع
                  </button>
                </Link>
                
                <button
                  onClick={handleContinue}
                  className="bg-[#00ab67] hover:bg-[#008550] text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold inline-flex items-center gap-2.5 cursor-pointer transition-all"
                  data-testid="button-continue"
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
