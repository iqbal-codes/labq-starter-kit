"use client";

import { useStore } from "@tanstack/react-form";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { FieldDescription, FieldLabel } from "../../field";
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField,
} from "../form-context";
import { Button } from "../../button";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { Input } from "../../input";
import { cn } from "@labq-modules/ui/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface MonthPickerFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  /** Allow clearing the value (sets field to empty string). */
  clearable?: boolean;
}

/**
 * Parses a "YYYY-MM" string into { year, monthIndex } or null when invalid.
 */
function parseMonthValue(value: string | null | undefined): {
  year: number;
  monthIndex: number;
} | null {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number.parseInt(match[1]!, 10);
  const monthIndex = Number.parseInt(match[2]!, 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
}

function formatMonthValue(year: number, monthIndex: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDisplay(value: string | null | undefined): string {
  const parsed = parseMonthValue(value);
  if (!parsed) return "";
  return `${MONTHS[parsed.monthIndex]} ${parsed.year}`;
}

export function MonthPickerField({
  label,
  description,
  required,
  placeholder = "Pick a month",
  minYear = 1990,
  maxYear = new Date().getFullYear() + 5,
  disabled,
  clearable = true,
}: MonthPickerFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const value = (useStore(field.store, (s) => s.value) as string) ?? "";
  const [open, setOpen] = useState(false);

  const parsed = parseMonthValue(value);
  const [viewYear, setViewYear] = useState<number>(parsed?.year ?? new Date().getFullYear());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  function commit(monthIndex: number) {
    field.handleChange(formatMonthValue(viewYear, monthIndex));
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
          <PopoverContent className="w-72 p-3" align="start">
            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewYear((y) => Math.max(minYear, y - 1))}
                disabled={viewYear <= minYear}
                aria-label="Previous year"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="font-medium text-sm">{viewYear}</div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
                disabled={viewYear >= maxYear}
                aria-label="Next year"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((name, index) => {
                const isSelected = parsed?.year === viewYear && parsed.monthIndex === index;
                const isHovered = hoverIndex === index;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => commit(index)}
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex(null)}
                    className={cn(
                      "rounded-3xl px-2 py-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isHovered
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted",
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormMonthPickerField = createFormField(MonthPickerField);
