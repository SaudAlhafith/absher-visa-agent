import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { AppointmentSlotCard } from "@/components/AppointmentSlotCard";
import { MapPin, Calendar, Users, ExternalLink, ArrowRight, ArrowLeft, Building2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Embassy, AppointmentSlot, VisaRequest } from "@shared/schema";

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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="overflow-visible">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground" data-testid="text-no-request">No visa request found. Please start from the beginning.</p>
              <Link href="/step-1">
                <Button className="mt-4" data-testid="button-restart">Start New Request</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator currentStep={3} />

        <div className="mt-8 space-y-8">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : (
            <>
              <Card className="overflow-visible">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid="title-embassy">Embassy Appointment</CardTitle>
                      <CardDescription data-testid="text-embassy-location">
                        {embassy?.name} - {embassy?.city}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {embassy?.hasIntegration ? (
                    <>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 mb-6">
                        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Slots provided by the embassy's booking system. Select a convenient date and time.
                        </p>
                      </div>

                      <h4 className="font-medium text-foreground mb-4 flex items-center gap-2" data-testid="title-slots">
                        <Calendar className="w-4 h-4 text-primary" />
                        Available Appointment Slots
                      </h4>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {embassy.availableSlots.map((slot) => (
                          <AppointmentSlotCard
                            key={slot.id}
                            slot={slot}
                            selected={selectedSlot?.id === slot.id}
                            onSelect={setSelectedSlot}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <ExternalLink className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium mb-2" data-testid="text-external-title">
                        External Booking Required
                      </p>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        Appointment booking for this embassy is handled on their official website. 
                        Your document pack will be ready to download.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(embassy?.externalBookingUrl, "_blank")}
                        data-testid="button-external-booking"
                      >
                        Go to Embassy Booking Website
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-visible">
                <CardHeader>
                  <CardTitle className="text-lg" data-testid="title-summary">Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Destination & Visa Type</p>
                        <p className="font-medium text-foreground" data-testid="text-summary-destination">
                          {request?.countryName} - {request?.visaTypeName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Travelers</p>
                        <p className="font-medium text-foreground" data-testid="text-summary-travelers">
                          {request?.travelers.length} {request?.travelers.length === 1 ? "person" : "people"} included
                        </p>
                      </div>
                    </div>

                    {selectedSlot && embassy?.hasIntegration && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Selected Appointment</p>
                          <p className="font-medium text-foreground" data-testid="text-summary-appointment">
                            {selectedSlot.date} at {selectedSlot.time}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground" data-testid="text-doc-ready">
                      Your document pack is ready. Please print it and bring it to your appointment.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-4 pt-4 flex-wrap">
                <Link href={`/step-2?requestId=${requestId}`}>
                  <Button variant="outline" data-testid="button-back">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                
                <Button 
                  onClick={handleComplete}
                  disabled={updateRequestMutation.isPending || (embassy?.hasIntegration && !selectedSlot)}
                  data-testid="button-finish"
                >
                  {updateRequestMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      Finish & View Summary
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
