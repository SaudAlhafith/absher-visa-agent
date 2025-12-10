import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Header } from "@/components/Header";
import { Check, Calendar, ExternalLink, ArrowLeft, Building2, Info, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Embassy, AppointmentSlot, VisaRequest, Country } from "@shared/schema";

export default function Step3() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
  const params = new URLSearchParams(search);
  const requestId = params.get("requestId") || "";

  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);

  const { data: request, isLoading: requestLoading } = useQuery<VisaRequest>({
    queryKey: ["/api/requests", requestId],
    enabled: !!requestId,
  });

  const { data: embassy, isLoading: embassyLoading } = useQuery<Embassy>({
    queryKey: ["/api/embassies", request?.countryId],
    enabled: !!request?.countryId,
  });

  const { data: country } = useQuery<Country>({
    queryKey: ["/api/countries", request?.countryId],
    enabled: !!request?.countryId,
  });

  const [appointmentType, setAppointmentType] = useState<"direct" | "external">("direct");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Auto-select the first date with available slots when embassy data loads
  useEffect(() => {
    if (embassy?.hasIntegration && embassy.availableSlots && selectedDate === null) {
      const firstAvailableSlot = embassy.availableSlots.find(slot => slot.available);
      if (firstAvailableSlot) {
        setSelectedDate(firstAvailableSlot.date);
      }
    }
  }, [embassy, selectedDate]);

  const updateRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/requests/${requestId}`, {
        status: "completed",
        appointmentDate: selectedSlot?.date,
        appointmentTime: selectedSlot?.time,
        embassyId: embassy?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setLocation(`/success?requestId=${requestId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete visa request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    if (embassy?.hasIntegration && !selectedSlot) {
      toast({
        title: "Select an appointment",
        description: "Please select an available time slot.",
        variant: "destructive",
      });
      return;
    }
    updateRequestMutation.mutate();
  };

  const isLoading = requestLoading || embassyLoading;

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    // Convert "09:00 AM" format to Arabic
    return timeString.replace('AM', 'ص').replace('PM', 'م');
  };

  // Generate date items for the calendar based on available slots
  const generateDateItems = () => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const items = [];
    
    // Get unique dates from available slots and create a set for quick lookup
    const slotDates = new Set(
      embassy?.availableSlots
        .filter(slot => slot.available)
        .map(slot => slot.date) || []
    );
    
    // If we have slots, use those dates; otherwise generate from today
    if (slotDates.size > 0) {
      const sortedDates = Array.from(slotDates).sort();
      const startDate = new Date(sortedDates[0]);
      
      // Generate 7 days starting from the first available slot date
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = days[date.getDay()];
        const dayNumber = date.getDate();
        // Only disable dates that don't have any available slots
        const isDisabled = !slotDates.has(dateStr);
        
        items.push({ dayName, dayNumber, date: dateStr, isDisabled });
      }
    } else {
      // Fallback: generate from today if no slots
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = days[date.getDay()];
        const dayNumber = date.getDate();
        // Disable first 2 days if no slots available
        const isDisabled = i < 2;
        
        items.push({ dayName, dayNumber, date: date.toISOString().split('T')[0], isDisabled });
      }
    }
    
    return items;
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
              <div className="font-medium text-[#333]">البيانات</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00ab67] text-white flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <div className="font-medium text-[#333]">المتطلبات</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00ab67] text-white flex items-center justify-center font-bold">3</div>
              <div className="font-medium text-[#333]">حجز الموعد</div>
            </div>
          </div>

          {isLoading ? (
            <>
              <div className="h-32 w-full mb-5 rounded-xl bg-[#e0e0e0] animate-pulse" />
              <div className="h-64 w-full mb-5 rounded-xl bg-[#e0e0e0] animate-pulse" />
            </>
          ) : (
            <>
              {/* Embassy Appointment Card */}
              <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
                <div className="bg-gradient-to-br from-[#00ab67] to-[#008550] text-white py-[18px] px-[25px] text-[17px] font-bold flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  حجز موعد السفارة
                </div>
                <div className="p-[25px]">
                  {/* Appointment Options */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div
                      onClick={() => setAppointmentType("direct")}
                      className={`p-5 border-2 rounded-xl cursor-pointer text-center transition-all ${
                        appointmentType === "direct"
                          ? "border-[#00ab67] bg-[#f8fdf9]"
                          : "border-[#e0e0e0] hover:border-[#00ab67]"
                      }`}
                    >
                      <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-3 text-xl text-[#00ab67]">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold mb-1">حجز مباشر</h4>
                      <p className="text-xs text-[#707070]">احجز من هنا</p>
                    </div>
                    <div
                      onClick={() => setAppointmentType("external")}
                      className={`p-5 border-2 rounded-xl cursor-pointer text-center transition-all ${
                        appointmentType === "external"
                          ? "border-[#00ab67] bg-[#f8fdf9]"
                          : "border-[#e0e0e0] hover:border-[#00ab67]"
                      }`}
                    >
                      <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-3 text-xl text-[#00ab67]">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold mb-1">موقع السفارة</h4>
                      <p className="text-xs text-[#707070]">انتقل للموقع</p>
                    </div>
                  </div>

                  {appointmentType === "direct" && embassy?.hasIntegration ? (
                    <>
                      <h4 className="mb-2.5 flex items-center gap-2 font-medium">
                        <Building2 className="w-4 h-4 text-[#00ab67]" />
                        {embassy.nameAr} - {embassy.cityAr}
                      </h4>
                      <p className="text-xs text-[#707070] mb-4">اختر التاريخ والوقت المناسب</p>
                      
                      {/* Date Picker */}
                      <div className="grid grid-cols-7 gap-1.5 mt-4 mb-4">
                        {generateDateItems().map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => !item.isDisabled && setSelectedDate(item.date)}
                            className={`p-2.5 text-center border rounded-md cursor-pointer text-sm ${
                              selectedDate === item.date
                                ? "bg-[#00ab67] border-[#00ab67] text-white"
                                : item.isDisabled
                                ? "bg-[#f5f5f5] text-gray-400 cursor-not-allowed"
                                : "border-[#e0e0e0] hover:border-[#00ab67]"
                            }`}
                          >
                            <small className="block mb-1">{item.dayName}</small>
                            <div>{item.dayNumber}</div>
                          </div>
                        ))}
                      </div>

                      {/* Time Slots */}
                      <div className="flex gap-2 flex-wrap mt-4">
                        {(() => {
                          // Filter slots based on selected date
                          const filteredSlots = embassy.availableSlots.filter(slot => {
                            if (!slot.available) return false;
                            // If no date selected, show all available slots
                            if (!selectedDate) return true;
                            // Compare dates directly (both should be in YYYY-MM-DD format)
                            return slot.date === selectedDate;
                          });

                          if (filteredSlots.length === 0) {
                            return (
                              <p className="text-sm text-[#707070] w-full text-center py-4">
                                لا توجد مواعيد متاحة لهذا التاريخ
                              </p>
                            );
                          }

                          return filteredSlots.map((slot) => (
                            <div
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 px-4 border-2 rounded-md cursor-pointer text-sm ${
                                selectedSlot?.id === slot.id
                                  ? "bg-[#00ab67] border-[#00ab67] text-white"
                                  : "border-[#e0e0e0] hover:border-[#00ab67]"
                              }`}
                            >
                              {formatTime(slot.time)}
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
                        <ExternalLink className="w-8 h-8 text-[#707070]" />
                      </div>
                      <p className="font-medium mb-2" data-testid="text-external-title">
                        حجز خارجي مطلوب
                      </p>
                      <p className="text-sm text-[#707070] mb-6 max-w-md mx-auto">
                        يتم حجز الموعد لهذه السفارة على موقعها الرسمي. ملف المستندات جاهز للتحميل.
                      </p>
                      <button
                        onClick={() => window.open(embassy?.externalBookingUrl, "_blank")}
                        className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer transition-all inline-flex items-center gap-2"
                        data-testid="button-external-booking"
                      >
                        الانتقال لموقع السفارة
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-[#f8fdf9] to-[#e8f5e9] border-2 border-[#00ab67] rounded-xl p-5 mb-5">
                <div className="flex justify-between py-2.5 border-b border-[#00ab67]/20">
                  <span className="text-[#707070] text-sm">الوجهة</span>
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <img src={getCountryFlag(country?.id || '')} alt={country?.name} className="w-5 h-4 rounded" />
                    {country?.nameAr}
                  </span>
                </div>
                {selectedSlot && embassy?.hasIntegration && (
                  <div className="flex justify-between py-2.5 border-b border-[#00ab67]/20">
                    <span className="text-[#707070] text-sm">الموعد</span>
                    <span className="font-semibold text-sm">
                      {formatDate(selectedSlot.date)} - {formatTime(selectedSlot.time)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2.5">
                  <span className="text-[#707070] text-sm">المكان</span>
                  <span className="font-semibold text-sm">{embassy?.nameAr} - {embassy?.cityAr}</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[#e3f2fd] border-r-4 border-[#247cd6] p-3 px-4 rounded-md mb-5 flex items-center gap-2.5 text-sm text-[#1565c0]">
                <Printer className="w-4 h-4" />
                ملف المستندات جاهز للطباعة. أحضره معك للموعد.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#e0e0e0]">
                <Link href={`/step-2?requestId=${requestId}`}>
                  <button
                    className="border-2 border-[#00ab67] text-[#00ab67] bg-transparent hover:bg-[#00ab67] hover:text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold cursor-pointer transition-all"
                    data-testid="button-back"
                  >
                    رجوع
                  </button>
                </Link>
                
                <button
                  onClick={handleComplete}
                  disabled={updateRequestMutation.isPending || (embassy?.hasIntegration && !selectedSlot)}
                  className="bg-[#00ab67] hover:bg-[#008550] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 px-7 rounded-lg text-[15px] font-semibold inline-flex items-center gap-2.5 cursor-pointer transition-all"
                  data-testid="button-finish"
                >
                  {updateRequestMutation.isPending ? (
                    "جاري المعالجة..."
                  ) : (
                    <>
                      تأكيد وإنهاء
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
