import type { DynamicFieldProps } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function TextField({ field, value, onChange, error, disabled }: DynamicFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-[14px] font-medium text-[#333]">
        {field.labelAr}
        {field.mandatory && <span className="text-red-500 mr-1">*</span>}
      </Label>
      
      <Textarea
        value={(value as string) || ""}
        onChange={(e) => onChange(field.fieldKey, e.target.value)}
        placeholder={field.noteAr || field.labelAr}
        disabled={disabled}
        className={`min-h-[80px] text-[14px] resize-none ${
          error ? "border-red-500" : "border-[#e0e0e0]"
        }`}
        dir="rtl"
      />
      
      {field.noteAr && !error && (
        <p className="text-[12px] text-[#707070]">{field.noteAr}</p>
      )}
      
      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}
    </div>
  );
}

