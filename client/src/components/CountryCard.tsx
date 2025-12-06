import type { Country } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Globe, Ban } from "lucide-react";

interface CountryCardProps {
  country: Country;
  selected: boolean;
  onSelect: (country: Country) => void;
}

const statusConfig = {
  visa_required: {
    label: "Visa Required",
    variant: "secondary" as const,
    icon: AlertCircle,
  },
  e_visa: {
    label: "e-Visa Available",
    variant: "default" as const,
    icon: Globe,
  },
  visa_free: {
    label: "Visa Free",
    variant: "default" as const,
    icon: Check,
  },
  not_allowed: {
    label: "Travel Not Allowed",
    variant: "destructive" as const,
    icon: Ban,
  },
};

export function CountryCard({ country, selected, onSelect }: CountryCardProps) {
  const config = statusConfig[country.visaStatus];
  const isDisabled = country.visaStatus === "not_allowed";

  return (
    <button
      onClick={() => !isDisabled && onSelect(country)}
      disabled={isDisabled}
      className={`
        w-full p-4 rounded-lg border text-left transition-all duration-200
        ${selected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-border bg-card"
        }
        ${isDisabled 
          ? "opacity-50 cursor-not-allowed" 
          : "hover-elevate active-elevate-2 cursor-pointer"
        }
      `}
      data-testid={`country-card-${country.id}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{country.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{country.name}</p>
          <p className="text-sm text-muted-foreground truncate">{country.nameAr}</p>
        </div>
        <Badge 
          variant={config.variant} 
          className="shrink-0 text-xs"
        >
          <config.icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>
    </button>
  );
}
