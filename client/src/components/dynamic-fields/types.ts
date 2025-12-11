/**
 * Types for dynamic field components
 * Re-exports schema types and adds component-specific types
 */

import type { DynamicField, EnumOption } from "@shared/schema";

export type { DynamicField, EnumOption };

// Field value types
export type FieldValue = string | File | File[] | null;

export interface DynamicFieldValues {
  [fieldKey: string]: FieldValue;
}

// Validation result
export interface FieldValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

// Component props
export interface DynamicFieldProps {
  field: DynamicField;
  value: FieldValue;
  onChange: (fieldKey: string, value: FieldValue) => void;
  error?: string;
  disabled?: boolean;
}

export interface DynamicFieldsFormProps {
  fields: DynamicField[];
  values: DynamicFieldValues;
  onChange: (values: DynamicFieldValues) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

