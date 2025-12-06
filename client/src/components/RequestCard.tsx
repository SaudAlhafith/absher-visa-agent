import type { VisaRequest } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";

interface RequestCardProps {
  request: VisaRequest;
  onView: (id: string) => void;
  onResume?: (id: string) => void;
}

export function RequestCard({ request, onView, onResume }: RequestCardProps) {
  const isDraft = request.status === "draft";
  const formattedDate = format(new Date(request.createdAt), "MMM d, yyyy");

  return (
    <Card 
      className="overflow-visible hover-elevate"
      data-testid={`request-card-${request.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {request.countryName} - {request.visaTypeName}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={isDraft ? "secondary" : "default"}>
              {isDraft ? "Draft" : "Completed"}
            </Badge>
            
            {isDraft && onResume ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onResume(request.id)}
                data-testid={`button-resume-${request.id}`}
              >
                Resume
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onView(request.id)}
                data-testid={`button-view-pdf-${request.id}`}
              >
                View PDF Pack
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
