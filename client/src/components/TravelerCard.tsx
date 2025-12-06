import type { Traveler } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "lucide-react";

interface TravelerCardProps {
  traveler: Traveler;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function TravelerCard({ traveler, selected, onToggle }: TravelerCardProps) {
  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-200 cursor-pointer
        ${selected 
          ? "border-primary bg-primary/5" 
          : "border-border bg-card"
        }
      `}
      onClick={() => onToggle(traveler.id)}
      data-testid={`traveler-card-${traveler.id}`}
    >
      <div className="flex items-start gap-4">
        <Checkbox 
          checked={selected}
          onCheckedChange={() => onToggle(traveler.id)}
          className="mt-1"
          data-testid={`checkbox-traveler-${traveler.id}`}
        />
        
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{traveler.name}</p>
          <p className="text-sm text-muted-foreground">{traveler.relationship}</p>
          <p className="text-xs text-muted-foreground mt-1">ID: {traveler.idNumber}</p>
        </div>
      </div>
    </div>
  );
}
