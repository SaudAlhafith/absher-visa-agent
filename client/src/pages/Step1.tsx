import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/Header";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { CountryCard } from "@/components/CountryCard";
import { TravelerCard } from "@/components/TravelerCard";
import { Search, ArrowRight, ArrowLeft, AlertTriangle, Users } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator currentStep={1} />

        <div className="mt-8 space-y-8">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="text-lg" data-testid="title-country-selection">Select Destination Country</CardTitle>
              <CardDescription>
                Choose the country you want to travel to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-country"
                />
              </div>

              {countriesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {filteredCountries.map((country) => (
                      <CountryCard
                        key={country.id}
                        country={country}
                        selected={selectedCountry?.id === country.id}
                        onSelect={setSelectedCountry}
                      />
                    ))}
                    {filteredCountries.length === 0 && (
                      <p className="text-center text-muted-foreground py-8" data-testid="text-no-countries">
                        No countries found matching your search.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}

              {selectedCountry?.visaStatus === "not_allowed" && (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3" data-testid="alert-not-allowed">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Travel Not Allowed</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Travel to this destination is currently not allowed for Saudi citizens.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="text-lg" data-testid="title-visa-type">Visa Type</CardTitle>
              <CardDescription>
                Select the type of visa you are applying for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visaTypesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedVisaType} onValueChange={setSelectedVisaType}>
                  <SelectTrigger data-testid="select-visa-type">
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    {visaTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id} data-testid={`option-visa-${type.id}`}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-visible">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg" data-testid="title-travelers">Who is traveling?</CardTitle>
                  <CardDescription>
                    Select yourself and any family members
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {travelersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {travelers?.map((traveler) => (
                    <TravelerCard
                      key={traveler.id}
                      traveler={traveler}
                      selected={selectedTravelers.has(traveler.id)}
                      onToggle={toggleTraveler}
                    />
                  ))}
                </div>
              )}

              <Button 
                variant="ghost" 
                className="mt-4 text-primary"
                data-testid="button-add-dependent"
              >
                + Add new dependent
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4 pt-4">
            <Link href="/">
              <Button variant="outline" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            
            <Button 
              onClick={handleContinue}
              disabled={!canContinue || createRequestMutation.isPending}
              data-testid="button-continue"
            >
              {createRequestMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  Continue - Check Requirements
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
