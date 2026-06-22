"use client";

import { useStore } from "@tanstack/react-form";
import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../badge";
import { Input } from "../../input";
import { FieldDescription, FieldLabel } from "../../field";
import { useFieldContext, FormFieldSet, FormField, FormFieldError } from "../form-context";

/**
 * TagsField — multi-value string input.
 *
 * Designed for use with `form.AppField mode="array"` so each value is a string.
 * Free-form: type + Enter (or comma) to add, Backspace on empty to remove last,
 * click chip "x" to remove.
 *
 * For AppField only — flat `FormTagsField` is not exported because flat pattern
 * cannot express `mode="array"` cleanly.
 *
 * @example
 * ```tsx
 * <form.AppField
 *   name="skills"
 *   mode="array"
 *   children={(field) => (
 *     <TagsField
 *       label="Skills"
 *       value={field.state.value ?? []}
 *       onChange={field.setValue}
 *       onBlur={field.handleBlur}
 *     />
 *   )}
 * />
 * ```
 */
interface TagsFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  value: string[];
  onChange: (next: string[]) => void;
  onBlur?: () => void;
}

export function TagsField({
  label,
  description,
  required,
  placeholder = "Type and press Enter",
  value,
  onChange,
  onBlur,
}: TagsFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const [draft, setDraft] = useState("");

  function commit() {
    const parts = draft.split(",");
    const next: string[] = [];
    for (const p of parts) {
      const t = p.trim();
      if (t) next.push(t);
    }
    if (next.length === 0) return;
    const merged = Array.from(new Set([...value, ...next]));
    onChange(merged);
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && " *"}
        </FieldLabel>
        <div
          id={field.name}
          onBlur={onBlur}
          className="border-input bg-input/30 flex min-h-9 flex-wrap items-center gap-1.5 rounded-3xl border bg-clip-padding px-2 py-1.5 text-sm transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20"
          aria-invalid={isTouched && !isValid}
        >
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              <span>{tag}</span>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="hover:text-destructive ml-1 inline-flex items-center"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => removeAt(value.indexOf(tag))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commit();
              } else if (e.key === "Backspace" && draft.length === 0 && value.length > 0) {
                e.preventDefault();
                removeAt(value.length - 1);
              }
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              if (/[,\n]/.test(pasted)) {
                e.preventDefault();
                const parts = pasted.split(/[,\n]/).flatMap((p) => {
                  const t = p.trim();
                  return t ? [t] : [];
                });
                if (parts.length > 0) {
                  onChange(Array.from(new Set([...value, ...parts])));
                  setDraft("");
                }
              }
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="h-7 min-w-32 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}
