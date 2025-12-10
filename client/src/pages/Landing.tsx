import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { BookText, History, FileText, CheckCircle, Edit, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VisaRequest } from "@shared/schema";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<VisaRequest[]>({
    queryKey: ["/api/requests"],
  });

  const handleViewPdf = (id: string) => {
    toast({
      title: "Opening PDF Pack",
      description: "Your document pack is being prepared for viewing.",
    });
  };

  const handleResume = (id: string) => {
    setLocation(`/step-2?requestId=${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCountryFlag = (countryId: string) => {
    
    return `https://flagcdn.com/w80/${countryId}.png`;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <main className="py-8 min-h-[70vh]">
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#00ab67] to-[#008550] text-white py-12 px-10 rounded-2xl text-center mb-8">
            <div className="w-20 h-20 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-5">
              <BookText className="w-9 h-9" />
            </div>
            <h1 className="text-[32px] font-extrabold mb-3" data-testid="title-hero">
              مساعد تجهيز التأشيرات
            </h1>
            <p className="text-[17px] opacity-95 max-w-[550px] mx-auto mb-6" data-testid="text-hero-description">
              نجهز لك كل متطلبات التأشيرة ومستندات السفارة باستخدام بياناتك الحكومية المتوفرة
            </p>
            <Link href="/step-1">
              <button 
                className="bg-white text-[#00ab67] hover:bg-white/90 inline-flex items-center gap-2.5 py-3.5 px-7 rounded-lg text-[15px] font-semibold transition-all cursor-pointer border-none"
                data-testid="button-start-request"
              >
                <span>بدء طلب تأشيرة جديد</span>
              </button>
            </Link>
          </div>

          {/* Previous Requests Section */}
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2.5" data-testid="title-previous-requests">
            <History className="w-5 h-5 text-[#00ab67]" />
            طلباتك السابقة
          </h2>
          
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
              <div className="p-[25px]">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-[#e0e0e0] last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-9 rounded bg-[#e0e0e0] animate-pulse" />
                        <div className="flex-1">
                          <div className="h-5 w-48 mb-2 bg-[#e0e0e0] rounded animate-pulse" />
                          <div className="h-4 w-32 bg-[#e0e0e0] rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-8 w-24 bg-[#e0e0e0] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
              <div className="p-[25px]">
                {requests.map((request, index) => (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-[18px] border-b border-[#e0e0e0] last:border-0"
                  >
                    <div className="flex items-center gap-[15px]">
                      <img 
                        src={getCountryFlag(request.countryId)} 
                        alt={request.countryName}
                        className="w-[48px] h-[36px] rounded object-cover shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                      />
                      <div>
                        <h4 className="font-semibold mb-[3px]">{request.countryName} - {request.visaTypeName}</h4>
                        <span className="text-[13px] text-[#707070]">
                          {formatDate(request.createdAt)} • {request.travelers.length} {request.travelers.length === 1 ? 'مسافر' : 'مسافرين'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-[5px] rounded-[20px] text-[13px] font-semibold inline-flex items-center gap-[5px] ${
                        request.status === 'completed' 
                          ? 'bg-[#e8f5e9] text-[#51a041]' 
                          : 'bg-[#fff3e0] text-[#f7941d]'
                      }`}>
                        {request.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            مكتمل
                          </>
                        ) : (
                          <>
                            <Edit className="w-3.5 h-3.5" />
                            مسودة
                          </>
                        )}
                      </span>
                      {request.status === 'completed' ? (
                        <button
                          className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-2 px-3.5 text-[13px] rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5"
                          onClick={() => handleViewPdf(request.id)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          الملفات
                        </button>
                      ) : (
                        <button
                          className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-2 px-3.5 text-[13px] rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5"
                          onClick={() => handleResume(request.id)}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          متابعة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#707070]" />
                </div>
                <p className="text-[#707070]" data-testid="text-no-requests">
                  لا توجد طلبات سابقة. ابدأ طلب تأشيرة جديد للبدء.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
