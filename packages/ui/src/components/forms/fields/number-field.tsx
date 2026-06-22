"use client";

import { useStore } from "@tanstack/react-form";
import { NumericFormat } from "react-number-format";
import { Input } from "../../input";
import { FieldDescription, FieldLabel } from "../../field";
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField,
} from "../form-context";
import { Spinner } from "../../spinner";

/**
 * Locale configuration for Intl.NumberFormat.
 * When provided, prefix/suffix/thousandSeparator/decimalSeparator
 * are derived from the locale unless explicitly overridden.
 *
 * @example { locale: 'de-DE', currency: 'EUR' } → 1.234,56 €
 * @example { locale: 'id-ID', currency: 'IDR' } → Rp 1.234
 */
interface IntlConfig {
  locale: string;
  currency?: string;
}

export interface NumberFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  /** Currency or symbol prefix (e.g. "$", "Rp "). Overrides locale-derived prefix. */
  prefix?: string;
  /** Suffix (e.g. " kg", "%"). Overrides locale-derived suffix. */
  suffix?: string;
  /** Character for grouping thousands. Default: ",". Set to false to disable. */
  thousandSeparator?: string | boolean;
  /** Character for decimal point. Default: "." */
  decimalSeparator?: string;
  /** Max decimal places the user can type. */
  decimalScale?: number;
  /** Always show exactly `decimalScale` decimals (pads with zeros). */
  fixedDecimalScale?: boolean;
  /** Allow negative numbers. Default: true. */
  allowNegative?: boolean;
  /** Min value (inclusive). */
  min?: number;
  /** Max value (inclusive). */
  max?: number;
  /** Step for ArrowUp/ArrowDown increment. Default: 1. */
  step?: number;
  /** Locale + currency config. When set, formatting is locale-aware. */
  intlConfig?: IntlConfig;
  /** Additional class name for the input. */
  className?: string;
  /** Disabled state. */
  disabled?: boolean;
}

export function NumberField({
  label,
  description,
  required,
  placeholder,
  prefix,
  suffix,
  thousandSeparator = true,
  decimalSeparator,
  decimalScale,
  fixedDecimalScale,
  allowNegative = true,
  min,
  max,
  step,
  className,
  disabled,
}: NumberFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const isValidating = useStore(field.store, (s) => s.meta.isValidating);
  const value = useStore(field.store, (s) => s.value) as number | null | undefined;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && " *"}
        </FieldLabel>
        <div className="relative">
          <NumericFormat
            id={field.name}
            value={value ?? ""}
            onValueChange={({ floatValue }) => {
              field.handleChange(floatValue ?? ("" as unknown as number));
            }}
            onBlur={field.handleBlur}
            placeholder={placeholder}
            prefix={prefix}
            suffix={suffix}
            thousandSeparator={thousandSeparator}
            decimalSeparator={decimalSeparator}
            decimalScale={decimalScale}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={allowNegative}
            min={min}
            max={max}
            step={step}
            customInput={Input}
            aria-invalid={isTouched && !isValid}
            className={className}
            disabled={disabled}
          />
          {isValidating && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <Spinner className="h-4 w-4" />
            </div>
          )}
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormNumberField = createFormField(NumberField);
