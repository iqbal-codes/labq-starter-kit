/**
 * tanstack-form.tsx — Barrel re-export for the form system.
 *
 * This file exists for backwards compatibility. New code should import from
 * the canonical sources:
 *   - Hooks (useAppForm, withForm, withFieldGroup, useFormFields)
 *     → use-form-hooks.ts
 *   - Primitives (createFormField, typedField, scrollToFirstError,
 *     useFieldContext, useFormContext, FormField*, FormErrors)
 *     → form-context.tsx
 */

// Hooks from the dedicated hooks file
export { useAppForm, withForm, withFieldGroup, useFormFields } from "./use-form-hooks";

// Types
export type {
  FieldConfig,
  FieldValidatorConfig,
  FieldListenerConfig,
  WithTypedName,
} from "./form-context";

// Primitives from form-context
export {
  createFormField,
  typedField,
  revalidateLogic,
  scrollToFirstError,
  useFieldContext,
  useFormContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  FormErrors,
} from "./form-context";
