import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { CheckCircle, Download, Home, Calendar, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VisaRequest } from "@shared/schema";

export default function Success() {
  const search = useSearch();
  const { toast } = useToast();
  
  const params = new URLSearchParams(search);
  const requestId = params.get("requestId") || "";

  const { data: request, isLoading } = useQuery<VisaRequest>({
    queryKey: ["/api/requests", requestId],
    enabled: !!requestId,
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="overflow-visible">
          <CardContent className="p-8 sm:p-12">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Skeleton className="w-20 h-20 rounded-full mb-6" />
                <Skeleton className="h-8 w-64 mb-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3" data-testid="title-success">
                    Your Visa Preparation is Complete
                  </h1>
                  
                  <p className="text-muted-foreground max-w-md" data-testid="text-success-description">
                    All documents have been prepared and your request has been saved. 
                    You can download your PDF pack anytime from your previous requests.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 mb-8">
                  <h2 className="font-semibold text-foreground mb-4" data-testid="title-request-summary">Request Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Destination & Visa</p>
                        <p className="font-medium text-foreground" data-testid="text-final-destination">
                          {request?.countryName} - {request?.visaTypeName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Travelers</p>
                        <p className="font-medium text-foreground" data-testid="text-final-travelers">
                          {request?.travelers.length} {request?.travelers.length === 1 ? "person" : "people"}
                        </p>
                      </div>
                    </div>

                    {request?.appointmentDate && request?.appointmentTime && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Embassy Appointment</p>
                          <p className="font-medium text-foreground" data-testid="text-final-appointment">
                            {request.appointmentDate} at {request.appointmentTime}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                  <Button 
                    size="lg"
                    onClick={handleDownload}
                    data-testid="button-download-pdf"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF Pack
                  </Button>
                  
                  <Link href="/">
                    <Button 
                      variant="outline" 
                      size="lg"
                      data-testid="button-back-home"
                    >
                      <Home className="w-5 h-5 mr-2" />
                      Back to Absher Home
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
