# Form System

A TanStack Form + shadcn/ui integration with 9 field types, field-level validation, async validation, multi-step forms, and type-safe field names.

## Dependencies

```bash
npm install @tanstack/react-form
npm install react-number-format  # Required for NumberField
npm install react-dropzone       # Required for FileUploadField
```

## Quick Start

```tsx
import { z } from "zod";
import { useAppForm, useFormFields } from "@labq-modules/ui/components/forms/tanstack-form";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  role: z.string().min(1, "Select a role"),
});

type FormValues = z.infer<typeof schema>;

export function MyForm() {
  const form = useAppForm({
    defaultValues: { name: "", email: "", role: "" } as FormValues,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      // Submit to API
    },
  });

  const { FormTextField, FormSelectField } = useFormFields<FormValues>();

  return (
    <form.AppForm>
      <form.Form>
        <FormTextField name="name" label="Full Name" required />
        <FormTextField name="email" label="Email" required type="email" />
        <FormSelectField
          name="role"
          label="Role"
          required
          options={[
            { value: "admin", label: "Admin" },
            { value: "editor", label: "Editor" },
          ]}
        />
        <form.SubmitButton>Save</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
}
```

## Architecture

The form system has three layers:

| Layer                | Location                                              | Purpose                                                                                            |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Field Components** | `packages/ui/src/components/forms/fields/*-field.tsx` | Individual field implementations (base + composed `FormXxxField`)                                  |
| **Form Context**     | `packages/ui/src/components/forms/form-context.tsx`   | Shared contexts, `createFormField()`, structural components, `useFieldContext()`, validation types |
| **TanStack Form**    | `packages/ui/src/components/forms/tanstack-form.tsx`  | `useAppForm()`, `useFormFields()`, `withForm()`, `withFieldGroup()` — the main entry point         |

## Two Usage Patterns

### 1. Flat Pattern (recommended for standard fields)

Use the composed `FormXxxField` components with `useFormFields<T>()` for type-safe names:

```tsx
import { useAppForm, useFormFields } from '@labq-modules/ui/components/forms/tanstack-form';

const { FormTextField, FormSelectField } = useFormFields<MyFormValues>();

// With validation
<FormTextField
  name='email'
  label='Email'
  required
  validators={{
    onBlur: z.string().email('Invalid email'),
    onChangeAsync: async ({ value }) => {
      if (!value || value.length < 3) return;
      await new Promise((r) => setTimeout(r, 500));
      if (value === 'taken@example.com') return 'Email already registered';
    },
    onChangeAsyncDebounceMs: 500
  }}
/>

// With side-effect listeners (reset dependent fields)
<FormSelectField
  name='country'
  label='Country'
  options={countryOptions}
  listeners={{
    onChange: ({ value, fieldApi }) => {
      // Reset dependent fields when country changes
      fieldApi.form.setFieldValue('state', '');
      fieldApi.form.setFieldValue('city', '');
    }
  }}
/>
```

### 2. AppField Pattern (for custom/specialized inputs)

Use `form.AppField` when no pre-built component exists (combobox, date picker, color picker, OTP, tags, checkbox groups, toggle groups):

```tsx
<form.AppField
  name="framework"
  mode="value" // 'value' (default) or 'array' for array fields
  validators={{
    onBlur: z.string().min(1),
  }}
  children={(field) => (
    <field.FieldSet>
      <field.Field>
        <field.FieldLabel>Framework *</field.FieldLabel>
        <ComboboxField
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          isTouched={field.state.meta.isTouched}
          isValid={field.state.meta.isValid}
        />
        <field.FieldDescription>Searchable dropdown</field.FieldDescription>
      </field.Field>
      <field.FieldError />
    </field.FieldSet>
  )}
/>
```

**Array fields** (checkbox groups, toggle groups, tags):

```tsx
<form.AppField
  name="interests"
  mode="array"
  children={(field) => {
    const values: string[] = field.state.value || [];
    return (
      <field.FieldSet>
        <field.FieldLabel>Interests</field.FieldLabel>
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <Checkbox
              checked={values.includes(opt.value)}
              onCheckedChange={(checked) => {
                if (checked) field.pushValue(opt.value);
                else {
                  const idx = values.indexOf(opt.value);
                  if (idx > -1) field.removeValue(idx);
                }
              }}
            />
            <Label>{opt.label}</Label>
          </div>
        ))}
        <field.FieldError />
      </field.FieldSet>
    );
  }}
/>
```

---

## Field Reference

### `FormTextField`

Text, email, password, tel, url, number via standard `<input>`.

| Prop          | Type                                                            | Default  | Description           |
| ------------- | --------------------------------------------------------------- | -------- | --------------------- |
| `label`       | `string`                                                        | required | Field label           |
| `description` | `string`                                                        | —        | Additional hint text  |
| `required`    | `boolean`                                                       | —        | Appends ` *` to label |
| `type`        | `'text' \| 'email' \| 'password' \| 'tel' \| 'url' \| 'number'` | `'text'` | HTML input type       |
| `placeholder` | `string`                                                        | —        | Placeholder text      |
| `className`   | `string`                                                        | —        | Additional styles     |

**Note:** For numeric values, `type='number'` emits `parseFloat` on change. When you need locale-aware formatting (currency, thousand separators), use `FormNumberField` instead.

### `FormNumberField`

Locale-aware numeric input via `react-number-format`. Supports currency, prefixes, suffixes, decimal scales.

| Prop                | Type                                    | Default  | Description                                  |
| ------------------- | --------------------------------------- | -------- | -------------------------------------------- |
| `label`             | `string`                                | required | Field label                                  |
| `description`       | `string`                                | —        | Additional hint text                         |
| `required`          | `boolean`                               | —        | Appends ` *` to label                        |
| `prefix`            | `string`                                | —        | Currency/symbol prefix (e.g. `"$"`, `"Rp "`) |
| `suffix`            | `string`                                | —        | Suffix (e.g. `" kg"`, `"%"`)                 |
| `thousandSeparator` | `string \| boolean`                     | `true`   | Grouping separator                           |
| `decimalSeparator`  | `string`                                | `"."`    | Decimal separator                            |
| `decimalScale`      | `number`                                | —        | Max decimal places                           |
| `fixedDecimalScale` | `boolean`                               | —        | Always show exactly `decimalScale` decimals  |
| `allowNegative`     | `boolean`                               | `true`   | Allow negative values                        |
| `min` / `max`       | `number`                                | —        | Inclusive bounds                             |
| `step`              | `number`                                | `1`      | Arrow key increment                          |
| `intlConfig`        | `{ locale: string, currency?: string }` | —        | Locale-aware formatting                      |
| `placeholder`       | `string`                                | —        | Placeholder text                             |
| `disabled`          | `boolean`                               | —        | Disabled state                               |

```tsx
// Currency
<FormNumberField name='price' label='Price' prefix='$' decimalScale={2} />

// Percentage
<FormNumberField name='tax' label='Tax Rate' suffix='%' decimalScale={1} />

// Locale-aware (Indonesian Rupiah)
<FormNumberField
  name='amount'
  label='Amount'
  intlConfig={{ locale: 'id-ID', currency: 'IDR' }}
/>
```

### `FormSelectField`

Single-select dropdown via shadcn `<Select>`.

| Prop          | Type                                 | Default              | Description           |
| ------------- | ------------------------------------ | -------------------- | --------------------- |
| `label`       | `string`                             | required             | Field label           |
| `description` | `string`                             | —                    | Additional hint text  |
| `required`    | `boolean`                            | —                    | Appends ` *` to label |
| `options`     | `{ value: string; label: string }[]` | required             | Selectable options    |
| `placeholder` | `string`                             | `'Select an option'` | Placeholder text      |

For searchable multi-select (combobox), use the AppField pattern with `<Command>` + `<Popover>` shown in the demo.

### `FormTextareaField`

Multi-line textarea with character count.

| Prop          | Type      | Default       | Description                             |
| ------------- | --------- | ------------- | --------------------------------------- |
| `label`       | `string`  | required      | Field label                             |
| `description` | `string`  | —             | Additional hint text                    |
| `required`    | `boolean` | —             | Appends ` *` to label                   |
| `maxLength`   | `number`  | —             | Max characters (shows counter when set) |
| `showCount`   | `boolean` | `!!maxLength` | Always show character count             |
| `rows`        | `number`  | —             | Visible rows                            |
| `placeholder` | `string`  | —             | Placeholder text                        |
| `className`   | `string`  | —             | Additional styles                       |

```tsx
<FormTextareaField
  name="bio"
  label="Bio"
  required
  placeholder="Tell us about yourself..."
  maxLength={500}
  rows={4}
/>
```

### `FormCheckboxField`

Single boolean checkbox, label on the right.

| Prop          | Type     | Default  | Description          |
| ------------- | -------- | -------- | -------------------- |
| `label`       | `string` | required | Field label          |
| `description` | `string` | —        | Additional hint text |

For checkbox groups (multiple values), use `form.AppField` with `mode='array'` as shown above.

### `FormSwitchField`

Toggle switch, label on the left.

| Prop          | Type     | Default  | Description                           |
| ------------- | -------- | -------- | ------------------------------------- |
| `label`       | `string` | required | Field label (rendered at `text-base`) |
| `description` | `string` | —        | Additional hint text                  |

### `FormRadioGroupField`

Radio button group for mutually exclusive options.

| Prop          | Type                                 | Default  | Description           |
| ------------- | ------------------------------------ | -------- | --------------------- |
| `label`       | `string`                             | required | Field label           |
| `description` | `string`                             | —        | Additional hint text  |
| `required`    | `boolean`                            | —        | Appends ` *` to label |
| `options`     | `{ value: string; label: string }[]` | required | Radio choices         |

### `FormSliderField`

Range slider with min/max labels.

| Prop          | Type     | Default  | Description          |
| ------------- | -------- | -------- | -------------------- |
| `label`       | `string` | required | Field label          |
| `description` | `string` | —        | Additional hint text |
| `min`         | `number` | `0`      | Minimum value        |
| `max`         | `number` | `100`    | Maximum value        |
| `step`        | `number` | `1`      | Step increment       |

### `FormFileUploadField`

File upload via the standalone `FileUploader` component. See [file-uploader.md](file-uploader.md) for the standalone component.

| Prop          | Type      | Default  | Description            |
| ------------- | --------- | -------- | ---------------------- |
| `label`       | `string`  | required | Field label            |
| `description` | `string`  | —        | Additional hint text   |
| `required`    | `boolean` | —        | Appends ` *` to label  |
| `maxSize`     | `number`  | `2MB`    | Max file size in bytes |
| `maxFiles`    | `number`  | `1`      | Max number of files    |

---

## Validation Strategies

### Field-Level Validation (flat pattern)

Pass `validators` to any `FormXxxField`:

```tsx
<FormTextField
  name="email"
  label="Email"
  validators={{
    // Sync — runs on every change
    onChange: z.string().email("Invalid email"),
    // Sync — runs on blur
    onBlur: z.string().email("Invalid email"),
    // Sync — runs on submit (safety net)
    onSubmit: z.string().email("Invalid email"),
    // Async — runs on change with debounce
    onChangeAsync: async ({ value }) => {
      const res = await fetch(`/api/check-email?email=${value}`);
      return res.ok ? undefined : "Already registered";
    },
    onChangeAsyncDebounceMs: 500,
  }}
/>
```

### Cross-Field Validation (form-level)

Use the form schema's `superRefine` for dependent fields:

```tsx
const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords must match",
        path: ["confirmPassword"], // Shows error on the confirmPassword field
      });
    }
  });
```

### Linked Validation (onChangeListenTo)

Re-run a field's validator when another field changes:

```tsx
<FormSelectField
  name="country"
  label="Country"
  options={countryOptions}
  validators={{
    onChangeListenTo: ["shippingMethod"], // Re-validate country when shippingMethod changes
    onChange: (val) => {
      // Custom validation that depends on other field values
      const form = useFormContext();
      const shippingMethod = form.getFieldValue("shippingMethod");
      if (shippingMethod === "express" && !val) {
        return "Country is required for express shipping";
      }
      return undefined;
    },
  }}
/>
```

---

## Side-Effect Listeners

Use `listeners` to react to field state changes (e.g., resetting dependent fields):

```tsx
<FormSelectField
  name="country"
  label="Country"
  options={countries}
  listeners={{
    onChange: ({ value, fieldApi }) => {
      // Reset dependent fields
      fieldApi.form.setFieldValue("state", "");
      fieldApi.form.setFieldValue("city", "");
    },
    onChangeDebounceMs: 300, // Debounce the listener
    onBlur: ({ value }) => {
      // Track analytics
    },
    onMount: ({ value }) => {
      // Initialize dependent fields
    },
  }}
/>
```

---

## Error Handling

### Displaying Errors

Every field component automatically shows validation errors via `FormFieldError` inside the field. Errors appear after the field is touched OR after the form fails its first submit attempt.

### Form-Level Errors

Render form-level (cross-field) validation errors with `FormErrors`:

```tsx
<form.AppForm>
  <form.Form>
    <FormErrors /> {/* Shows errors from form schema validators */}
    <FormTextField name="name" label="Name" />
    <form.SubmitButton>Submit</form.SubmitButton>
  </form.Form>
</form.AppForm>
```

### Scroll to First Error

```tsx
const form = useAppForm({
  defaultValues: {...},
  validators: { onSubmit: schema },
  onSubmitInvalid: () => scrollToFirstError(),  // Smooth-scroll to first invalid field
  onSubmit: async ({ value }) => { ... }
});
```

---

## Multi-Step Forms

Use the `useFormStepper` hook:

```tsx
import { useFormStepper } from '@labq-modules/ui/hooks/use-stepper';
import { useAppForm, useFormFields } from '@labq-modules/ui/components/forms/tanstack-form';

const stepSchemas = [step1Schema, step2Schema, step3Schema];

export function MultiStepForm() {
  const { step, isFirstStep, handleNextStepOrSubmit, handleCancelOrBack } =
    useFormStepper(stepSchemas);

  const form = useAppForm({
    defaultValues: {...},
    validators: { onSubmit: fullSchema },
    onSubmit: async ({ value }) => { ... }
  });

  return (
    <form.AppForm>
      <form.Form>
        {/* Step indicator */}
        <div>Step {step.value} of {step.count}</div>

        {step.value === 1 && <Step1Fields />}
        {step.value === 2 && <Step2Fields />}
        {step.value === 3 && <Step3Fields />}

        <div className='flex gap-2'>
          <form.StepButton
            label={isFirstStep ? 'Cancel' : 'Back'}
            handleMovement={() => handleCancelOrBack({ onCancel: () => {}, onBack: () => {} })}
          />
          <form.SubmitButton>
            {step.isCompleted ? 'Submit' : 'Next'}
          </form.SubmitButton>
        </div>
      </form.Form>
    </form.AppForm>
  );
}
```

For multi-step validation per step:

```tsx
const handleNext = async () => {
  const result = currentValidator.safeParse(form.state.values);
  if (!result.success) {
    // Show errors without advancing
    return;
  }
  step.goToNextStep();
};
```

---

## Creating Custom Fields

### Wrap an Existing shadcn Component

```tsx
"use client";
import { useStore } from "@tanstack/react-form";
import { Input } from "@labq-modules/ui/components/input";
import { FieldLabel } from "@labq-modules/ui/components/field";
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField,
} from "@labq-modules/ui/components/forms/form-context";

interface CustomColorFieldProps {
  label: string;
}

function ColorField({ label }: CustomColorFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as string;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel>{label}</FieldLabel>
        <Input
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
        />
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormColorField = createFormField(ColorField);
```

### Make It Type-Safe

Add the custom field to `useFormFields` in your form:

```tsx
function useTypedFormFields() {
  const { FormTextField /* ... */ } = useFormFields<MyFormValues>();
  const TypedColorField = typedField<MyFormValues>()(FormColorField);

  return { FormTextField, FormColorField: TypedColorField };
}
```

---

## Structural Components Available on `form.*`

### Layout

| Component               | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `form.FieldSet`         | Groups related fields (renders `<fieldset>`)           |
| `form.Field`            | Single field wrapper with error state, aria attributes |
| `form.FieldLabel`       | Label element                                          |
| `form.FieldDescription` | Hint text below field                                  |
| `form.FieldContent`     | Flexible content container                             |
| `form.FieldError`       | Validation error display                               |
| `form.FieldLegend`      | Legend for fieldset groups                             |
| `form.FieldSeparator`   | Visual separator between fields                        |

### Input Group

| Component              | Description               |
| ---------------------- | ------------------------- |
| `form.InputGroup`      | Groups input with add-ons |
| `form.InputGroupInput` | Input inside group        |
| `form.InputGroupAddon` | Prefix/suffix add-on      |

### Actions

| Component           | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `form.Form`         | Form element (handles submit, `noValidate`)          |
| `form.SubmitButton` | Submit button (shows loading, disables when invalid) |
| `form.StepButton`   | Multi-step navigation button                         |

---

## Common Pitfalls

1. **Zod schemas on `onSubmit` vs field validators**: Always pass the full schema to `validators: { onSubmit: schema }` as a safety net. Field-level validators (onChange/onBlur) are for UX feedback — they catch errors early but the onSubmit validator catches anything missed.

2. **Form-level vs field-level error display**: `FormErrors` shows `state.errors` from `form.Subscribe`, which includes form-level validation errors (from the schema's `superRefine` or form-level `onSubmitInvalid`). Individual field errors are shown by `FormFieldError` inside each field.

3. **`noValidate` is always set**: The form component applies `noValidate` automatically — browser native validation is disabled in favor of TanStack Form + Zod.

4. **`submitEvent.preventDefault()` is automatic**: The form handles `e.preventDefault()` and `e.stopPropagation()` internally.

5. **`useFormFields` requires generic type**: Always pass `TValues` (typically `z.infer<typeof schema>`) to get type-safe field names.

6. **Array fields need `mode='array'`**: For checkbox groups, tags, and multi-select inputs, pass `mode='array'` to `form.AppField` so you can use `pushValue()`, `removeValue()`, etc. Without this, the field treats values as a single value and calling `pushValue` is not available.

7. **React state inside AppField render props**: Do NOT use `useState` inside the `children` render prop of `AppField`. Extract stateful logic into separate components. The render prop re-runs on every field store change, which can cause infinite loops with React state.

8. **Zod `safeParse` for manual validation**: When using `useFormStepper`, use `z.safeParse` instead of relying on `form.handleSubmit` to validate intermediate steps.

---

## Exports Reference

### From `@labq-modules/ui/components/forms/tanstack-form`

| Export               | Type      | Description                                      |
| -------------------- | --------- | ------------------------------------------------ |
| `useAppForm`         | Hook      | Creates a form instance (TanStack Form + shadcn) |
| `useFormFields`      | Hook      | Returns type-safe field components               |
| `withForm`           | HOC       | Wraps a component with form context              |
| `withFieldGroup`     | HOC       | Wraps a component with field group context       |
| `FormErrors`         | Component | Form-level error display                         |
| `scrollToFirstError` | Function  | Smooth-scroll to first invalid field             |
| `revalidateLogic`    | Utility   | TanStack Form revalidation logic                 |
| `createFormField`    | Factory   | Wraps a base field into a composed component     |
| `typedField`         | Utility   | Narrows a field's name prop to type-safe keys    |

### From `@labq-modules/ui/components/forms/form-context`

| Export                 | Type      | Description                                         |
| ---------------------- | --------- | --------------------------------------------------- |
| `fieldContext`         | Context   | TanStack Form field context                         |
| `formContext`          | Context   | TanStack Form form context                          |
| `useFieldContext`      | Hook      | Enhanced field context with accessibility IDs       |
| `useFormContext`       | Hook      | Form context (same as TanStack Form)                |
| `createFormField`      | Factory   | Wraps a base field into a composed `FormXxxField`   |
| `FormFieldSet`         | Component | `<fieldset>` wrapper                                |
| `FormField`            | Component | Field wrapper with error state                      |
| `FormFieldError`       | Component | Error display                                       |
| `FormErrors`           | Component | Form-level error list                               |
| `scrollToFirstError`   | Function  | Scroll to first invalid field                       |
| `FieldConfig`          | Type      | Validators, listeners, asyncDebounceMs, mode config |
| `FieldValidatorConfig` | Type      | Sync/async validator config                         |
| `FieldListenerConfig`  | Type      | Side-effect listener config                         |
| `WithTypedName`        | Type      | Type helper for narrowing field name                |
