# File Uploader

A standalone drag-&-drop file upload component built on `react-dropzone` with preview thumbnails (for images), progress tracking, file size limits, and controllable state.

## Dependencies

```bash
npm install react-dropzone
npm install sonner    # Toast notifications (already in dashboard)
```

**Note:** `sonner` is used for toast notifications during upload (success, error, rejection messages). If your project doesn't use `sonner`, replace `toast.error()` and `toast.promise()` calls with your toast library.

---

## Quick Start

```tsx
import { FileUploader } from "@admin-template/ui/components/file-uploader";

function ProfilePictureUpload() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      maxFiles={1}
      maxSize={5 * 1024 * 1024} // 5MB
    />
  );
}
```

### With Server Upload

```tsx
<FileUploader
  value={files}
  onValueChange={setFiles}
  onUpload={async (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    await fetch("/api/upload", { method: "POST", body: formData });
  }}
  maxFiles={5}
/>
```

When `onUpload` is provided, the uploader automatically:

1. Shows a loading toast ("Uploading N files...")
2. Calls `onUpload(files)` with all accepted files
3. Shows success toast ("N files uploaded") and clears the file list
4. Shows error toast on failure ("Failed to upload N files")

### With Progress Tracking

```tsx
const [progresses, setProgresses] = useState<Record<string, number>>({});

<FileUploader
  value={files}
  onValueChange={setFiles}
  onUpload={async (files) => {
    // Update progress from your upload implementation (e.g., XMLHttpRequest)
    // progresses = { 'file1.png': 45, 'file2.pdf': 100 }
  }}
  progresses={progresses}
/>;
```

---

## Props

| Prop            | Type                               | Default             | Description                                 |
| --------------- | ---------------------------------- | ------------------- | ------------------------------------------- |
| `value`         | `File[]`                           | —                   | Controlled file list                        |
| `onValueChange` | `(files: File[]) => void`          | —                   | Called when files change                    |
| `onUpload`      | `(files: File[]) => Promise<void>` | —                   | Upload handler (shows toasts automatically) |
| `progresses`    | `Record<string, number>`           | —                   | Upload progress per filename (0-100)        |
| `accept`        | `DropzoneProps['accept']`          | `{ 'image/*': [] }` | Accepted MIME types                         |
| `maxSize`       | `number`                           | `2MB`               | Max file size in bytes                      |
| `maxFiles`      | `number`                           | `1`                 | Max number of files                         |
| `multiple`      | `boolean`                          | `false`             | Allow multiple files in selection           |
| `disabled`      | `boolean`                          | `false`             | Disable interaction                         |
| `className`     | `string`                           | —                   | Additional styles                           |

---

## Accept Types

The `accept` prop follows `react-dropzone`'s format:

```tsx
// Images only (default)
accept={{ 'image/*': [] }}

// Images + PDFs
accept={{
  'image/*': [],
  'application/pdf': ['.pdf']
}}

// Specific image formats
accept={{
  'image/png': ['.png'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/webp': ['.webp']
}}

// Documents
accept={{
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc', '.docx'],
  'text/plain': ['.txt']
}}

// Any file type
accept={{}}
```

---

## Behavior Details

### File Rejection

When a file is rejected (wrong type, exceeds maxSize, or maxFiles reached):

```tsx
// Internal behavior:
// 1. Shows toast.error(`File ${file.name} was rejected`)
// 2. Rejected files are NOT added to the file list
// 3. List of acceptable files are still accepted

// Custom rejection handling in onDrop:
<FileUploader
  onDrop={(acceptedFiles, fileRejections) => {
    fileRejections.forEach(({ file, errors }) => {
      errors.forEach((error) => {
        console.error(`File ${file.name}: ${error.message}`);
      });
    });
  }}
/>
```

However, `onDrop` is not currently exposed as a prop on `FileUploader`. To customize rejection behavior, extend the component or copy it into your project.

### Previews

For image files, a preview thumbnail is generated automatically using `URL.createObjectURL()`. The preview is displayed as a 48x48 image next to the file name.

Previews are revoked when the component unmounts to prevent memory leaks (handled by the `useEffect` cleanup in `FileUploader`).

### Controllable State

The component uses `useControllableState` from `hooks/use-controllable-state.ts`. This means:

- **Controlled mode**: Pass `value` and `onValueChange` — component state is fully controlled
- **Uncontrolled mode**: Omit `value` — component manages its own state internally

```tsx
// Uncontrolled — component manages state
<FileUploader maxFiles={3} />

// Controlled — parent manages state
<FileUploader value={files} onValueChange={setFiles} maxFiles={3} />
```

---

## Usage with the Form System

The `FormFileUploadField` (from `components/forms/fields/file-upload-field.tsx`) wraps `FileUploader` for use inside TanStack Forms:

```tsx
import { useAppForm, useFormFields } from "@admin-template/ui/components/forms/tanstack-form";

const { FormFileUploadField } = useFormFields<MyFormValues>();

<form.AppForm>
  <form.Form>
    <FormFileUploadField
      name="avatar"
      label="Profile Picture"
      description="Drag & drop or click to upload (max 5MB)"
      maxSize={5000000}
      maxFiles={1}
    />
    <form.SubmitButton>Save</form.SubmitButton>
  </form.Form>
</form.AppForm>;
```

### Form Integration Details

When using `FormFileUploadField`:

- The field value is `File[] | undefined`
- Blur is handled by a `div` wrapper around the FileUploader (triggers on any click outside)
- Validation (e.g., required, max files) is handled by your Zod schema:

```tsx
const schema = z.object({
  avatar: z.array(z.any()).min(1, "Please upload at least one file"),
});
```

---

## Internal Component: `FileCard`

Rendered for each uploaded file inside a `ScrollArea` (max-height: `12rem` / 192px):

```
┌──────────────────────────────────────────────┐
│  ┌──────────┐                                │
│  │ 48x48     │  filename.png           [✕]   │
│  │ Preview   │  1.2 MB                       │
│  │           │  ████████░░ 80%               │
│  └──────────┘                                │
└──────────────────────────────────────────────┘
```

Each `FileCard` shows:

- Image preview (if file has a `preview` property — auto-assigned for images)
- File name (truncated to one line)
- File size via `formatBytes()`
- Upload progress bar (if `progress` is defined for this file)
- Remove button (disabled while upload is in progress, i.e., `progress < 100`)

---

## Edge Cases & Best Practices

### Memory Management

- **Previews are auto-revoked** on component unmount. However, if you store `value` externally and the component unmounts, preview URLs in the parent's state will be invalid. Either:
  - Allow the component to manage unmounting naturally, or
  - Override the cleanup logic if you need to keep previews alive

### Multi-File Limit

- `maxFiles` takes precedence over `multiple`. Even with `multiple: true`, the component enforces `maxFiles`. The `multiple` flag is set internally to `maxFiles > 1 || multiple`.
- If `maxFiles={1}` and the user drags multiple files, all are rejected with: "Cannot upload more than 1 file at a time".

### Disabled State

- When `disabled` is `true` or the file list reaches `maxFiles`, the dropzone shows `pointer-events-none` and `opacity-60`.
- Existing files can still be removed individually via the ✕ button (unless upload is in progress).

### Server Upload with Progress

`FileUploader` does NOT implement actual upload progress tracking — it renders `progresses` passed in. To implement progress:

```tsx
const [progresses, setProgresses] = useState<Record<string, number>>({});

async function handleUpload(files: File[]) {
  for (const file of files) {
    // Use XMLHttpRequest for progress events
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgresses((prev) => ({
            ...prev,
            [file.name]: Math.round((e.loaded / e.total) * 100),
          }));
        }
      };
      xhr.onload = () => resolve();
      xhr.onerror = () => reject();
      xhr.open("POST", "/api/upload");
      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  }
}

<FileUploader
  value={files}
  onValueChange={setFiles}
  onUpload={handleUpload}
  progresses={progresses}
/>;
```

### formData with onUpload

When `onUpload` is called:

- All accepted files from the current drop/selection are passed together
- After successful upload, `setFiles([])` is called (clears the file list)
- On failure, the error toast is shown but files remain in the list (user can retry)

---

## Exports

| Export              | Type      | Description                 |
| ------------------- | --------- | --------------------------- |
| `FileUploader`      | Component | Main dropzone file uploader |
| `FileUploaderProps` | Type      | Component props             |

Also available as a form field:

| Export                | Location                                        | Description                                       |
| --------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `FileUploadField`     | `components/forms/fields/file-upload-field.tsx` | Base field (for AppField pattern)                 |
| `FormFileUploadField` | `components/forms/fields/file-upload-field.tsx` | Composed field (flat pattern via `useFormFields`) |

---

## Common Pitfalls

1. **`sonner` dependency**: The component hard-depends on `sonner` for toast notifications. If your project uses a different toast library, replace `toast.error()` and `toast.promise()` calls.

2. **Preview URLs use standard `<img>` tag**: The `FileCard` component renders preview thumbnails with a standard `<img>` tag. No `next/image` dependency required.

3. **`onUpload` clears files**: After `onUpload` succeeds, the file list is cleared via `setFiles([])`. If you need to keep files after upload, don't use `onUpload` — handle upload separately and sync progress manually.

4. **Memory leaks with external state**: If you store the file list in a parent component and the `FileUploader` unmounts (e.g., tab switch), preview URLs become invalid. The cleanup `useEffect` is component-local.

5. **Progress tracking is external**: The component only renders progress values — it doesn't track actual upload progress. You must implement the progress calculation and pass it via the `progresses` prop.
