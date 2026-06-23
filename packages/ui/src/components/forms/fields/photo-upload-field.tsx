"use client";

import { useStore } from "@tanstack/react-form";
import type { DropzoneProps } from "react-dropzone";

import { FileUploader } from "../../file-uploader";
import { FieldDescription, FieldLabel } from "../../field";
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField,
} from "../form-context";

const DEFAULT_PHOTO_MAX_SIZE = 5 * 1024 * 1024;
const DEFAULT_PHOTO_MAX_FILES = 6;

interface BasePhotoUploadFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  maxSize?: number;
  accept?: DropzoneProps["accept"];
  previewUrl?: string;
  onPreviewRemove?: () => void;
}

export interface AvatarUploadFieldProps extends BasePhotoUploadFieldProps {}

export interface PhotoUploadFieldProps extends BasePhotoUploadFieldProps {
  maxFiles?: number;
}

function SharedPhotoUploadField({
  label,
  description,
  required,
  maxSize,
  maxFiles,
  accept,
  previewUrl,
  onPreviewRemove,
  variant,
}: BasePhotoUploadFieldProps & {
  maxFiles: number;
  variant: "avatar" | "photos";
}) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as File[] | undefined;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && " *"}
        </FieldLabel>
        <div onBlur={field.handleBlur}>
          <FileUploader
            inputId={field.name}
            value={value}
            onValueChange={field.handleChange}
            accept={accept ?? { "image/*": [] }}
            maxSize={maxSize ?? DEFAULT_PHOTO_MAX_SIZE}
            maxFiles={maxFiles}
            multiple={maxFiles > 1}
            variant={variant}
            previewUrl={previewUrl}
            onPreviewRemove={onPreviewRemove}
          />
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export function AvatarUploadField(props: AvatarUploadFieldProps) {
  return <SharedPhotoUploadField {...props} maxFiles={1} variant="avatar" />;
}

export function PhotoUploadField({
  maxFiles = DEFAULT_PHOTO_MAX_FILES,
  ...props
}: PhotoUploadFieldProps) {
  return <SharedPhotoUploadField {...props} maxFiles={maxFiles} variant="photos" />;
}

export const FormAvatarUploadField = createFormField(AvatarUploadField);
export const FormPhotoUploadField = createFormField(PhotoUploadField);
