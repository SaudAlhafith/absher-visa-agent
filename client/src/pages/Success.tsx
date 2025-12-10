import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { Check, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VisaRequest, Country } from "@shared/schema";

export default function Success() {
  const search = useSearch();
  const { toast } = useToast();
  
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

  const handleDownload = () => {
    toast({
      title: "Downloading PDF Pack",
      description: "Your complete document pack is being prepared for download.",
    });
  };

  if (!requestId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="overflow-visible">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground" data-testid="text-no-request">No visa request found.</p>
              <Link href="/">
                <Button className="mt-4" data-testid="button-go-home">Go to Home</Button>
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
        <div className="max-w-[1200px] mx-auto px-5">
          <Card className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Skeleton className="w-[90px] h-[90px] rounded-full mb-5" />
                  <Skeleton className="h-8 w-64 mb-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : (
                <div className="text-center py-12 px-5">
                  {/* Success Icon */}
                  <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-br from-[#00cc7b] to-[#00ab67] flex items-center justify-center mx-auto mb-5">
                    <Check className="w-[42px] h-[42px] text-white" />
                  </div>
                  
                  {/* Success Title */}
                  <h2 className="text-[26px] font-bold text-[#00ab67] mb-2" data-testid="title-success">
                    تم إكمال تجهيز التأشيرة!
                  </h2>
                  
                  {/* Description */}
                  <p className="text-[#707070] mb-6" data-testid="text-success-description">
                    تم حجز موعدك وملف المستندات جاهز
                  </p>

                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-[#f8fdf9] to-[#e8f5e9] border-2 border-[#00ab67] rounded-xl p-5 mb-6 max-w-md mx-auto text-right">
                    <div className="flex justify-between py-2.5 border-b border-[#00ab67]/20">
                      <span className="text-[#707070] text-sm">رقم الطلب</span>
                      <span className="font-semibold text-sm" data-testid="text-request-id">
                        #{request?.id.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-[#00ab67]/20">
                      <span className="text-[#707070] text-sm">الوجهة</span>
                      <span className="font-semibold text-sm flex items-center gap-2" data-testid="text-final-destination">
                        <img src={getCountryFlag(country?.id || '')} alt={country?.name} className="w-5 h-4 rounded" />
                        {country?.nameAr}
                      </span>
                    </div>
                    {request?.appointmentDate && request?.appointmentTime && (
                      <div className="flex justify-between py-2.5">
                        <span className="text-[#707070] text-sm">الموعد</span>
                        <span className="font-semibold text-sm" data-testid="text-final-appointment">
                          {formatDate(request.appointmentDate)} - {formatTime(request.appointmentTime)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={handleDownload}
                      className="bg-[#00ab67] hover:bg-[#008550] text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold inline-flex items-center gap-2.5"
                      data-testid="button-download-pdf"
                    >
                      <Download className="w-4 h-4" />
                      تحميل PDF
                    </Button>
                    
                    <Link href="/">
                      <Button
                        variant="outline"
                        className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold"
                        data-testid="button-back-home"
                      >
                        العودة للرئيسية
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
