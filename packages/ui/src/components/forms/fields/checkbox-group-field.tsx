"use client";

import { useStore } from "@tanstack/react-form";
import { Checkbox } from "../../checkbox";
import { Label } from "../../label";
import { FieldDescription, FieldLabel } from "../../field";
import { useFieldContext, FormFieldSet, FormFieldError } from "../form-context";

type Option = { value: string; label: string };

interface CheckboxGroupFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  options: Option[];
}

/**
 * Multi-value boolean-group field. Built for use with `form.AppField mode="array"`.
 *
 * Maintains the array of selected values itself — use `field.state.value` as the
 * initial value and `field.setValue` to commit. Provides a single field-level
 * error display, but the value itself is the array.
 *
 * @example
 * ```tsx
 * <form.AppField
 *   name="workMode"
 *   mode="array"
 *   children={(field) => (
 *     <CheckboxGroupField
 *       label="Work mode"
 *       value={field.state.value ?? []}
 *       onChange={field.setValue}
 *       options={workModeOptions}
 *     />
 *   )}
 * />
 * ```
 */
export function CheckboxGroupField({
  label,
  description,
  required,
  options,
}: CheckboxGroupFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const value = (useStore(field.store, (s) => s.value) as string[]) ?? [];
  const hasVisibleErrors = !!field.errors.length && isTouched;

  function toggle(optionValue: string, checked: boolean) {
    if (checked) {
      field.handleChange(Array.from(new Set([...value, optionValue])));
    } else {
      field.handleChange(value.filter((v) => v !== optionValue));
    }
    field.handleBlur();
  }

  return (
    <FormFieldSet aria-invalid={isTouched && !isValid}>
      <FieldLabel>
        {label}
        {required && " *"}
      </FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      <div className="grid gap-2">
        {options.map((opt) => {
          const id = `${field.name}-${opt.value}`;
          return (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={value.includes(opt.value)}
                onCheckedChange={(checked) => toggle(opt.value, checked as boolean)}
              />
              <Label htmlFor={id}>{opt.label}</Label>
            </div>
          );
        })}
      </div>
      {hasVisibleErrors ? <FormFieldError /> : null}
    </FormFieldSet>
  );
}
