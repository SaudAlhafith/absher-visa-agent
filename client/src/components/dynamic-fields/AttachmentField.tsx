import { useRef } from "react";
import type { DynamicFieldProps } from "./types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Plus } from "lucide-react";

export function AttachmentField({ field, value, onChange, error, disabled }: DynamicFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle both single file and array of files
  const files = Array.isArray(value) ? value : value ? [value as File] : [];
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    if (field.isRepeatable) {
      // Add to existing files
      onChange(field.fieldKey, [...files, ...selectedFiles]);
    } else {
      // Replace with single file
      onChange(field.fieldKey, selectedFiles[0]);
    }
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  
  const handleRemoveFile = (index: number) => {
    if (field.isRepeatable) {
      const newFiles = files.filter((_, i) => i !== index);
      onChange(field.fieldKey, newFiles.length > 0 ? newFiles : null);
    } else {
      onChange(field.fieldKey, null);
    }
  };
  
  const triggerFileSelect = () => {
    inputRef.current?.click();
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-[14px] font-medium text-[#333]">
        {field.labelAr}
        {field.mandatory && <span className="text-red-500 mr-1">*</span>}
        {field.isRepeatable && (
          <span className="text-[12px] text-[#707070] font-normal mr-2">
            (يمكن إضافة أكثر من ملف)
          </span>
        )}
      </Label>
      
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        multiple={field.isRepeatable}
      />
      
      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg border border-[#e0e0e0]"
            >
              <FileText className="w-5 h-5 text-[#00ab67]" />
              <span className="flex-1 text-[13px] text-[#333] truncate">
                {file.name}
              </span>
              <span className="text-[11px] text-[#707070]">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Upload button */}
      {(files.length === 0 || field.isRepeatable) && !disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          className={`w-full h-[60px] border-2 border-dashed ${
            error ? "border-red-500" : "border-[#e0e0e0] hover:border-[#00ab67]"
          }`}
        >
          {files.length > 0 ? (
            <Plus className="w-5 h-5 ml-2 text-[#00ab67]" />
          ) : (
            <Upload className="w-5 h-5 ml-2 text-[#707070]" />
          )}
          <span className="text-[13px] text-[#707070]">
            {files.length > 0 ? "إضافة ملف آخر" : "اضغط لرفع الملف"}
          </span>
        </Button>
      )}
      
      {field.noteAr && !error && (
        <p className="text-[12px] text-[#707070]">{field.noteAr}</p>
      )}
      
      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}
    </div>
  );
}

