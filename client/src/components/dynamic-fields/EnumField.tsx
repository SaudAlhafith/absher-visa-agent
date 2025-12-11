import type { DynamicFieldProps } from "./types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EnumField({ field, value, onChange, error, disabled }: DynamicFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-[14px] font-medium text-[#333]">
        {field.labelAr}
        {field.mandatory && <span className="text-red-500 mr-1">*</span>}
      </Label>
      
      <Select
        value={(value as string) || ""}
        onValueChange={(val) => onChange(field.fieldKey, val)}
        disabled={disabled}
        dir="rtl"
      >
        <SelectTrigger 
          className={`w-full text-[14px] ${
            error ? "border-red-500" : "border-[#e0e0e0]"
          }`}
        >
          <SelectValue placeholder="اختر..." />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.labelAr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}
    </div>
  );
}

