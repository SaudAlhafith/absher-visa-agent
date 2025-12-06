import type { VisaRequirement } from "@shared/schema";
import { Check, AlertCircle, Info } from "lucide-react";

interface RequirementItemProps {
  requirement: VisaRequirement;
}

const statusConfig = {
  available: {
    icon: Check,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Available from Absher data",
  },
  to_provide: {
    icon: Info,
    color: "text-amber-600 dark:text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "To be provided by you",
  },
  missing: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Missing",
  },
};

export function RequirementItem({ requirement }: RequirementItemProps) {
  const config = statusConfig[requirement.status];
  const Icon = config.icon;

  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
      data-testid={`requirement-${requirement.id}`}
    >
      <div className={`w-6 h-6 rounded-full ${config.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{requirement.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
      </div>
    </div>
  );
}
