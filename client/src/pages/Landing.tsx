import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { IconContainer } from "@/components/IconContainer";
import { RequestCard } from "@/components/RequestCard";
import { Plane, ArrowRight, FileText, Clock, Shield } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="overflow-visible mb-12">
          <CardContent className="p-8 sm:p-12">
            <div className="flex flex-col items-center text-center">
              <IconContainer icon={Plane} size="lg" className="mb-6" />
              
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4" data-testid="title-hero">
                Visa Preparation Assistant
              </h1>
              
              <p className="text-muted-foreground max-w-xl mb-8 leading-relaxed" data-testid="text-hero-description">
                Absher will prepare all visa requirements and embassy documents using your 
                existing government data, and help with booking an appointment. No extra 
                typing needed - we handle everything for you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 w-full max-w-lg">
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <FileText className="w-6 h-6 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground text-center" data-testid="text-feature-1">Auto-generated documents</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Clock className="w-6 h-6 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground text-center" data-testid="text-feature-2">Quick processing</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Shield className="w-6 h-6 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground text-center" data-testid="text-feature-3">Secure & verified</span>
                </div>
              </div>
              
              <Link href="/step-1">
                <Button size="lg" className="px-8" data-testid="button-start-request">
                  Start a New Visa Request
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground" data-testid="title-previous-requests">Previous Requests</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onView={handleViewPdf}
                  onResume={request.status === "draft" ? handleResume : undefined}
                />
              ))}
            </div>
          ) : (
            <Card className="overflow-visible">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground" data-testid="text-no-requests">
                  No previous requests yet. Start a new visa request to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
