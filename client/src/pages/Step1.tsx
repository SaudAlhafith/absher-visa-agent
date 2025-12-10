import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Search, ArrowLeft, Globe, FileText, Users, Umbrella, Briefcase, GraduationCap, Heart, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Country, VisaType, Traveler } from "@shared/schema";

export default function Step1() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedVisaType, setSelectedVisaType] = useState<string>("");
  const [selectedTravelers, setSelectedTravelers] = useState<Set<string>>(new Set());

  const { data: countries, isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const { data: visaTypes, isLoading: visaTypesLoading } = useQuery<VisaType[]>({
    queryKey: ["/api/visa-types"],
  });

  const { data: travelers, isLoading: travelersLoading } = useQuery<Traveler[]>({
    queryKey: ["/api/travelers"],
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/requests", {
        countryId: selectedCountry!.id,
        visaTypeId: selectedVisaType,
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
    selectedVisaType && 
    selectedTravelers.size > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    createRequestMutation.mutate();
  };

  const getCountryFlag = (countryId: string) => {
    return `https://flagcdn.com/w80/${countryId}.png`;
  };

  const getVisaStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; class: string }> = {
      visa_required: { text: "تأشيرة مطلوبة", class: "bg-[#fff3e0] text-[#e65100]" },
      e_visa: { text: "تأشيرة إلكترونية", class: "bg-[#e3f2fd] text-[#1565c0]" },
      visa_free: { text: "بدون تأشيرة", class: "bg-[#e8f5e9] text-[#2e7d32]" },
      not_allowed: { text: "غير مسموح", class: "bg-[#ffebee] text-[#c62828]" },
    };
    return labels[status] || labels.visa_required;
  };

  const getVisaTypeIcon = (id: string) => {
    const icons: Record<string, any> = {
      tourist: Umbrella,
      business: Briefcase,
      student: GraduationCap,
      medical: Heart,
      transit: UserPlus,
    };
    return icons[id] || FileText;
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

          {/* Country Selection */}
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
            <div className="bg-gradient-to-br from-[#00ab67] to-[#008550] text-white py-[18px] px-[25px] text-[17px] font-bold flex items-center gap-3">
              <Globe className="w-5 h-5" />
              اختر الدولة
            </div>
            <div className="p-[25px]">
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
          </div>

          {/* Visa Type Selection */}
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5 overflow-hidden">
            <div className="bg-gradient-to-br from-[#00ab67] to-[#008550] text-white py-[18px] px-[25px] text-[17px] font-bold flex items-center gap-3">
              <FileText className="w-5 h-5" />
              نوع التأشيرة
            </div>
            <div className="p-[25px]">
              {visaTypesLoading ? (
                <div className="flex gap-3 flex-wrap">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-24 rounded-lg bg-[#e0e0e0] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {visaTypes?.map((type) => {
                    const Icon = getVisaTypeIcon(type.id);
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedVisaType(type.id)}
                        className={`py-2.5 px-5 border-2 rounded-lg cursor-pointer font-medium flex items-center gap-2 transition-all ${
                          selectedVisaType === type.id
                            ? "bg-[#00ab67] border-[#00ab67] text-white"
                            : "bg-white border-[#e0e0e0] text-[#333] hover:border-[#00ab67]"
                        }`}
                        data-testid={`option-visa-${type.id}`}
                      >
                        <Icon className={`w-4 h-4 ${selectedVisaType === type.id ? "text-white" : "text-[#333]"}`} />
                        {type.nameAr}
                      </button>
                    );
                  })}
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
