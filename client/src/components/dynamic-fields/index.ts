/**
 * Dynamic Fields Components
 * 
 * Modular components for rendering country-specific visa application fields.
 * Use DynamicFieldsForm as the main entry point.
 * 
 * @example
 * ```tsx
 * import { DynamicFieldsForm, validateDynamicFields } from "@/components/dynamic-fields";
 * 
 * <DynamicFieldsForm
 *   fields={countryFields.fields}
 *   values={fieldValues}
 *   onChange={setFieldValues}
 *   errors={fieldErrors}
 * />
 * ```
 */

export { DynamicFieldsForm, validateDynamicFields } from "./DynamicFieldsForm";
export { TextField } from "./TextField";
export { EnumField } from "./EnumField";
export { AttachmentField } from "./AttachmentField";
export * from "./types";

