/**
 * use-form-hooks.ts — Canonical source for TanStack Form hooks.
 *
 * Provides useAppForm, withForm, withFieldGroup, and useFormFields.
 * Import these from here rather than from tanstack-form.tsx to avoid
 * importing the full form-components barrel.
 */

import { createFormHook } from "@tanstack/react-form";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { Button, type buttonVariants } from "../button";
import {
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldTitle,
} from "../field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../input-group";
// eslint-disable-next-line react-doctor/no-barrel-import -- ./fields/index consolidates 20+ field component exports
import {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  SwitchField,
  RadioGroupField,
  SliderField,
  FileUploadField,
  NumberField,
  TagsField,
  ComboboxField,
  FormComboboxField,
  MonthPickerField,
  FormMonthPickerField,
  FormDatePickerField,
  CheckboxGroupField,
  FormTextField,
  FormTextareaField,
  FormSelectField,
  FormCheckboxField,
  FormSwitchField,
  FormRadioGroupField,
  FormSliderField,
  FormFileUploadField,
  FormNumberField,
} from "./fields";
import {
  fieldContext,
  formContext,
  useFormContext,
  FormFieldSet,
  FormField,
  FormFieldError,
} from "./form-context";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Form-level components (used as form.ComponentName)
// ---------------------------------------------------------------------------

function Form({
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"form">, "onSubmit" | "noValidate"> & {
  children?: React.ReactNode;
}) {
  const form = useFormContext();
  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    },
    [form],
  );
  return (
    <form
      onSubmit={handleSubmit}
      className={cn("mx-auto flex w-full flex-col gap-2", props.className)}
      noValidate
      {...props}
    >
      {children}
    </form>
  );
}

function SubmitButton({
  children,
  className,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <Button
          className={className}
          size={size}
          type="submit"
          disabled={!canSubmit}
          isLoading={isSubmitting}
          {...props}
        >
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}

function StepButton({
  label,
  handleMovement,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    label: React.ReactNode | string;
    handleMovement: () => void;
  }) {
  return (
    <Button size="sm" variant="ghost" type="button" onClick={handleMovement} {...props}>
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Hook creation
// ---------------------------------------------------------------------------

const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Field: FormField,
    FieldError: FormFieldError,
    FieldSet: FormFieldSet,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldTitle,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    TextField,
    TextareaField,
    SelectField,
    CheckboxField,
    SwitchField,
    RadioGroupField,
    SliderField,
    FileUploadField,
    NumberField,
    TagsField,
    ComboboxField,
    MonthPickerField,
    CheckboxGroupField,
  },
  formComponents: {
    Form,
    SubmitButton,
    StepButton,
    FieldLegend,
    FieldDescription,
    FieldSeparator,
    TextField: FormTextField,
    TextareaField: FormTextareaField,
    SelectField: FormSelectField,
    CheckboxField: FormCheckboxField,
    SwitchField: FormSwitchField,
    RadioGroupField: FormRadioGroupField,
    SliderField: FormSliderField,
    FileUploadField: FormFileUploadField,
    NumberField: FormNumberField,
    ComboboxField: FormComboboxField,
    MonthPickerField: FormMonthPickerField,
  },
});

// ---------------------------------------------------------------------------
// Type-safe field names — useFormFields
// ---------------------------------------------------------------------------

import type { WithTypedName } from "./form-context";

/**
 * Returns all composed field components with type-safe `name` props.
 * Pass your form's value type (or `z.infer<typeof schema>`) to narrow names.
 */
function useFormFields<TValues extends Record<string, unknown>>() {
  type Typed<C> = WithTypedName<C, TValues>;
  return {
    FormTextField: FormTextField as unknown as Typed<typeof FormTextField>,
    FormTextareaField: FormTextareaField as unknown as Typed<typeof FormTextareaField>,
    FormSelectField: FormSelectField as unknown as Typed<typeof FormSelectField>,
    FormCheckboxField: FormCheckboxField as unknown as Typed<typeof FormCheckboxField>,
    FormSwitchField: FormSwitchField as unknown as Typed<typeof FormSwitchField>,
    FormRadioGroupField: FormRadioGroupField as unknown as Typed<typeof FormRadioGroupField>,
    FormSliderField: FormSliderField as unknown as Typed<typeof FormSliderField>,
    FormFileUploadField: FormFileUploadField as unknown as Typed<typeof FormFileUploadField>,
    FormNumberField: FormNumberField as unknown as Typed<typeof FormNumberField>,
    FormComboboxField: FormComboboxField as unknown as Typed<typeof FormComboboxField>,
    FormMonthPickerField: FormMonthPickerField as unknown as Typed<typeof FormMonthPickerField>,
    FormDatePickerField: FormDatePickerField as unknown as Typed<typeof FormDatePickerField>,
  };
}

export { useAppForm, withForm, withFieldGroup, useFormFields };
export {
  scrollToFirstError,
  FormFieldSet,
  FormField,
  FormFieldError,
  FormErrors,
} from "./form-context";
