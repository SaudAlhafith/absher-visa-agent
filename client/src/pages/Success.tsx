import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { Check, Download, MapPin, Clock, FileText, ExternalLink, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VisaRequest, Country } from "@shared/schema";

// Embassy instructions type (matches server/data/embassy-instructions.ts)
interface EmbassyInstructions {
  countryId: string;
  titleAr: string;
  stepsAr: string[];
  itemsToBringAr: string[];
  noteAr?: string;
  centerNameAr?: string;
  websiteUrl?: string;
}

export default function Success() {
  const search = useSearch();
  const { toast } = useToast();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const params = new URLSearchParams(search);
  const requestId = params.get("requestId") || "";

  const { data: request, isLoading } = useQuery<VisaRequest>({
    queryKey: ["/api/requests", requestId],
    enabled: !!requestId,
  });

  const { data: country } = useQuery<Country>({
    queryKey: ["/api/countries", request?.countryId],
    enabled: !!request?.countryId,
  });

  const { data: instructions } = useQuery<EmbassyInstructions>({
    queryKey: ["/api/countries", request?.countryId, "instructions"],
    queryFn: async () => {
      const res = await fetch(`/api/countries/${request?.countryId}/instructions`);
      if (!res.ok) throw new Error("Failed to fetch instructions");
      return res.json();
    },
    enabled: !!request?.countryId,
  });

  const handleDownload = () => {
    toast({
      title: "جاري التحميل",
      description: "يتم تجهيز ملف PDF الخاص بك للتحميل...",
    });
  };

  if (!requestId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="overflow-visible">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لم يتم العثور على طلب تأشيرة.</p>
              <Link href="/">
                <Button className="mt-4">العودة للرئيسية</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getCountryFlag = (countryId: string) => {
    return `https://flagcdn.com/w40/${countryId}.png`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.replace('AM', 'ص').replace('PM', 'م');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <main className="py-8 min-h-[70vh]">
        <div className="max-w-[800px] mx-auto px-5">
          {/* Success Card */}
          <Card className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden mb-6">
            <CardContent className="p-8">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Skeleton className="w-[90px] h-[90px] rounded-full mb-5" />
                  <Skeleton className="h-8 w-64 mb-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : (
                <div className="text-center">
                  {/* Success Icon */}
                  <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-[#00cc7b] to-[#00ab67] flex items-center justify-center mx-auto mb-4">
                    <Check className="w-[38px] h-[38px] text-white" />
                  </div>
                  
                  {/* Success Title */}
                  <h2 className="text-[24px] font-bold text-[#00ab67] mb-2">
                    تم إكمال تجهيز طلب التأشيرة!
                  </h2>
                  
                  {/* Description */}
                  <p className="text-[#707070] mb-5">
                    تم حجز موعدك بنجاح وملف المستندات جاهز للتحميل
                  </p>

                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-[#f8fdf9] to-[#e8f5e9] border-2 border-[#00ab67] rounded-xl p-4 mb-5 text-right">
                    <div className="flex justify-between py-2 border-b border-[#00ab67]/20">
                      <span className="text-[#707070] text-[13px]">رقم الطلب</span>
                      <span className="font-semibold text-[13px]">
                        #{request?.id.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#00ab67]/20">
                      <span className="text-[#707070] text-[13px]">الوجهة</span>
                      <span className="font-semibold text-[13px] flex items-center gap-2">
                        <img src={getCountryFlag(country?.id || '')} alt={country?.name} className="w-5 h-3.5 rounded" />
                        {country?.nameAr}
                      </span>
                    </div>
                    {request?.appointmentDate && request?.appointmentTime && (
                      <div className="flex justify-between py-2">
                        <span className="text-[#707070] text-[13px]">الموعد</span>
                        <span className="font-semibold text-[13px]">
                          {formatDate(request.appointmentDate)} - {formatTime(request.appointmentTime)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Download Button */}
                  <Button
                    onClick={handleDownload}
                    className="bg-[#00ab67] hover:bg-[#008550] text-white py-3 px-6 rounded-lg text-[14px] font-semibold inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تحميل ملف PDF كامل
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          {instructions && (
            <Card className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden mb-6">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#2196f3] to-[#1976d2] text-white p-5">
                  <h3 className="text-[18px] font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {instructions.titleAr}
                  </h3>
                  {instructions.centerNameAr && (
                    <p className="text-white/90 text-[14px] mt-1">
                      {instructions.centerNameAr}
                    </p>
                  )}
                </div>

                <div className="p-5">
                  {/* Steps */}
                  <div className="mb-5">
                    <h4 className="font-semibold text-[14px] text-[#333] mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#2196f3]" />
                      خطوات يوم الموعد
                    </h4>
                    <ol className="space-y-2.5">
                      {instructions.stepsAr.map((step, index) => (
                        <li key={index} className="flex gap-3 text-[13px]">
                          <span className="w-6 h-6 rounded-full bg-[#2196f3]/10 text-[#2196f3] flex items-center justify-center flex-shrink-0 font-semibold text-[12px]">
                            {index + 1}
                          </span>
                          <span className="text-[#333] pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Items to Bring */}
                  <div className="mb-5 bg-[#fff8e1] rounded-lg p-4">
                    <h4 className="font-semibold text-[14px] text-[#f57f17] mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      لا تنسَ إحضار
                    </h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {instructions.itemsToBringAr.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-[13px] text-[#333]">
                          <ChevronLeft className="w-3 h-3 text-[#f57f17]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Note */}
                  {instructions.noteAr && (
                    <div className="bg-[#e3f2fd] rounded-lg p-4 text-[13px] text-[#1565c0]">
                      <strong>ملاحظة:</strong> {instructions.noteAr}
                    </div>
                  )}

                  {/* Website Link */}
                  {instructions.websiteUrl && (
                    <a
                      href={instructions.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-[#2196f3] hover:text-[#1976d2] text-[13px] font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      زيارة موقع مركز التأشيرات
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back to Home */}
          <div className="text-center">
            <Link href="/">
              <Button
                variant="outline"
                className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-3 px-6 rounded-lg text-[14px] font-semibold"
              >
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
