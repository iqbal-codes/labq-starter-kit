"use client";

import { useStore } from "@tanstack/react-form";
import { useState } from "react";
import { X } from "lucide-react";
import { FieldDescription, FieldLabel } from "../../field";
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField,
} from "../form-context";
import { Button } from "../../button";
import { Calendar } from "../../calendar";
import { Input } from "../../input";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";

interface DatePickerFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  /** Allow clearing the value (sets field to empty string). */
  clearable?: boolean;
}

/**
 * Parses a "YYYY-MM-DD" string into a Date (local, no timezone shift) or null.
 */
function parseDateValue(value: string | null | undefined): Date | null {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10) - 1;
  const day = Number.parseInt(match[3]!, 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return new Date(year, month, day);
}

function formatDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string | null | undefined): string {
  const parsed = parseDateValue(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// eslint-disable-next-line react-doctor/deslop/unused-export -- used by createFormField below and re-exported through fields barrel
export function DatePickerField({
  label,
  description,
  required,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  disabled,
  clearable = true,
}: DatePickerFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const value = (useStore(field.store, (s) => s.value) as string) ?? "";
  const [open, setOpen] = useState(false);

  const selected = parseDateValue(value);

  function commit(date: Date | undefined) {
    if (!date) return;
    field.handleChange(formatDateValue(date));
    field.handleBlur();
    setOpen(false);
  }

  function clear() {
    field.handleChange("");
    field.handleBlur();
  }

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel>
          {label}
          {required && " *"}
        </FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <div className="flex gap-2">
            <PopoverTrigger
              nativeButton={false}
              render={
                <Input
                  readOnly
                  placeholder={placeholder}
                  disabled={disabled}
                  aria-invalid={isTouched && !isValid}
                  className="cursor-pointer"
                  onBlur={field.handleBlur}
                />
              }
              value={formatDisplay(value)}
            />
            {clearable && value ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clear}
                disabled={disabled}
                aria-label="Clear"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected ?? undefined}
              onSelect={commit}
              captionLayout="dropdown"
              showOutsideDays
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
            />
          </PopoverContent>
        </Popover>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormDatePickerField = createFormField(DatePickerField);
