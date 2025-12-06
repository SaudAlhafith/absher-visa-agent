import type { AppointmentSlot } from "@shared/schema";
import { format, parseISO } from "date-fns";

interface AppointmentSlotCardProps {
  slot: AppointmentSlot;
  selected: boolean;
  onSelect: (slot: AppointmentSlot) => void;
}

export function AppointmentSlotCard({ slot, selected, onSelect }: AppointmentSlotCardProps) {
  const formattedDate = format(parseISO(slot.date), "EEE, MMM d");
  
  return (
    <button
      onClick={() => slot.available && onSelect(slot)}
      disabled={!slot.available}
      className={`
        p-4 rounded-lg border text-center transition-all duration-200
        ${selected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-border bg-card"
        }
        ${!slot.available 
          ? "opacity-50 cursor-not-allowed" 
          : "hover-elevate active-elevate-2 cursor-pointer"
        }
      `}
      data-testid={`slot-${slot.id}`}
    >
      <p className="font-medium text-foreground">{formattedDate}</p>
      <p className="text-lg font-semibold text-primary mt-1">{slot.time}</p>
      {!slot.available && (
        <p className="text-xs text-muted-foreground mt-1">Unavailable</p>
      )}
    </button>
  );
}
