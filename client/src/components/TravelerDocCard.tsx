import type { TravelerDocStatus } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, FileText, Check, AlertCircle } from "lucide-react";

interface TravelerDocCardProps {
  traveler: TravelerDocStatus;
  onPreview: (travelerId: string) => void;
}

export function TravelerDocCard({ traveler, onPreview }: TravelerDocCardProps) {
  const isReady = traveler.status === "ready";

  return (
    <Card 
      className="overflow-visible"
      data-testid={`traveler-doc-card-${traveler.travelerId}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{traveler.travelerName}</CardTitle>
              <p className="text-sm text-muted-foreground">{traveler.relationship}</p>
            </div>
          </div>
          <Badge 
            variant={isReady ? "default" : "secondary"}
            className="shrink-0"
          >
            {isReady ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Ready
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Missing {traveler.missingCount} items
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          We prepared a personalized document list for this traveler.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onPreview(traveler.travelerId)}
          data-testid={`button-preview-pdf-${traveler.travelerId}`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Preview PDF Pack
        </Button>
      </CardContent>
    </Card>
  );
}
