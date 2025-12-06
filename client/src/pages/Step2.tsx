import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { RequirementItem } from "@/components/RequirementItem";
import { TravelerDocCard } from "@/components/TravelerDocCard";
import { MapPin, FileText, ArrowRight, ArrowLeft, Download, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Country, VisaType, VisaRequirement, TravelerDocStatus, VisaRequest } from "@shared/schema";

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
        <ProgressIndicator currentStep={2} />

        <div className="mt-8 space-y-8">
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </>
          ) : (
            <>
              <Card className="overflow-visible bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-card shadow-sm flex items-center justify-center text-2xl">
                      {country?.flag}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground" data-testid="text-destination">
                        Destination: {country?.name} - {visaType?.name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Using data from Passport Index & government records
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-visible">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2" data-testid="title-requirements">
                    <FileText className="w-5 h-5 text-primary" />
                    Visa Requirements
                  </CardTitle>
                  <CardDescription>
                    Documents and requirements for your visa application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {requirements?.map((req) => (
                      <RequirementItem key={req.id} requirement={req} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2" data-testid="title-traveler-docs">
                  Traveler Documents
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {travelerDocs?.map((doc) => (
                    <TravelerDocCard
                      key={doc.travelerId}
                      traveler={doc}
                      onPreview={handlePreviewPdf}
                    />
                  ))}
                </div>
              </div>

              <Card className="overflow-visible bg-muted/50 border-muted">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium" data-testid="text-info-title">
                      Data from Government Records
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      All personal data used here comes from your existing government records. 
                      No extra typing needed.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-4 pt-4 flex-wrap">
                <Link href="/step-1">
                  <Button variant="outline" data-testid="button-back">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleDownloadAll}
                    data-testid="button-download-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All PDFs
                  </Button>
                  
                  <Button 
                    onClick={handleContinue}
                    data-testid="button-continue"
                  >
                    Continue - Book Embassy Appointment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
