import type { DynamicField, DynamicFieldValues, DynamicFieldsFormProps, FieldValue } from "./types";
import { TextField } from "./TextField";
import { EnumField } from "./EnumField";
import { AttachmentField } from "./AttachmentField";

/**
 * Renders the appropriate field component based on field configuration
 */
function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: {
  field: DynamicField;
  value: FieldValue;
  onChange: (fieldKey: string, value: FieldValue) => void;
  error?: string;
  disabled?: boolean;
}) {
  if (field.kind === "ATTACHMENT") {
    return (
      <AttachmentField
        field={field}
        value={value}
        onChange={onChange}
        error={error}
        disabled={disabled}
      />
    );
  }

  // FIELD kind
  switch (field.dataType) {
    case "ENUM":
      return (
        <EnumField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case "TEXT":
    default:
      return (
        <TextField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
  }
}

/**
 * Main form component for rendering country-specific dynamic fields
 * Renders fields inline - parent component handles organization/sections
 */
export function DynamicFieldsForm({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
}: DynamicFieldsFormProps) {
  if (fields.length === 0) {
    return null;
  }

  const handleFieldChange = (fieldKey: string, value: FieldValue) => {
    onChange({
      ...values,
      [fieldKey]: value,
    });
  };

  return (
    <div className="grid gap-5">
      {fields.map((field) => (
        <DynamicFieldRenderer
          key={field.fieldKey}
          field={field}
          value={values[field.fieldKey] || null}
          onChange={handleFieldChange}
          error={errors[field.fieldKey]}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/**
 * Validate dynamic fields and return errors
 */
export function validateDynamicFields(
  fields: DynamicField[],
  values: DynamicFieldValues
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!field.mandatory) continue;

    const value = values[field.fieldKey];

    if (field.kind === "ATTACHMENT") {
      const files = Array.isArray(value) ? value : value ? [value] : [];
      if (files.length === 0) {
        errors[field.fieldKey] = "هذا الحقل مطلوب";
      }
    } else {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[field.fieldKey] = "هذا الحقل مطلوب";
      }
    }
  }

  return errors;
}

