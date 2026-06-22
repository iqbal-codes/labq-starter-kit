"use client";

import { useStore } from "@tanstack/react-form";
import { useState } from "react";
import { FieldDescription, FieldLabel } from "../../field";
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField,
} from "../form-context";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../../combobox";
import { useComboboxAnchor } from "../../combobox";

type Option = { value: string; label: string };

export interface ComboboxFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
}

/**
 * Single-select searchable combobox. Built on top of the shared
 * base-ui `Combobox` primitive.
 *
 * Works as a flat field via `FormComboboxField` and as AppField via `ComboboxField`.
 */
export function ComboboxField({
  label,
  description,
  required,
  options,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
}: ComboboxFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const value = (useStore(field.store, (s) => s.value) as string) ?? "";
  const [open, setOpen] = useState(false);
  const anchor = useComboboxAnchor();

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && " *"}
        </FieldLabel>
        <div ref={anchor}>
          <Combobox
            value={value}
            onValueChange={(next: string | null) => {
              field.handleChange(next ?? "");
              field.handleBlur();
            }}
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) field.handleBlur();
            }}
          >
            <ComboboxInput
              id={field.name}
              placeholder={placeholder}
              showTrigger
              showClear
              aria-invalid={isTouched && !isValid}
            />
            <ComboboxContent anchor={anchor}>
              <ComboboxList>
                {options.map((opt) => (
                  <ComboboxItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
              <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormComboboxField = createFormField(ComboboxField);
