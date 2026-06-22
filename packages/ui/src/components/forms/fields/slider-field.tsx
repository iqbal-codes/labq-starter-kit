"use client";

import { useStore } from "@tanstack/react-form";
import { Slider } from "../../slider";
import { FieldDescription, FieldLabel } from "../../field";
import { useFieldContext, FormFieldSet, FormField, createFormField } from "../form-context";

export interface SliderFieldProps {
  label: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function SliderField({
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
}: SliderFieldProps) {
  const field = useFieldContext();
  const value = (useStore(field.store, (s) => s.value) as number) ?? min;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel>{label}</FieldLabel>
        <div className="px-1">
          <Slider
            min={min}
            max={max}
            step={step}
            value={value}
            onValueChange={(val) => field.handleChange(Array.isArray(val) ? val[0] : val)}
            onBlur={field.handleBlur}
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs tabular-nums">
            <span>{min}</span>
            <span className="font-medium">
              {value}/{max}
            </span>
            <span>{max}</span>
          </div>
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
    </FormFieldSet>
  );
}

export const FormSliderField = createFormField(SliderField);
