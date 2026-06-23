"use client";

import { Icons } from "./icons";
import * as React from "react";
import Dropzone, { type DropzoneProps, type FileRejection } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "./button";
import { Progress } from "./progress";
import { ScrollArea } from "./scroll-area";
import { useControllableState } from "../hooks/use-controllable-state";
import { cn, formatBytes } from "../lib/utils";

export type FileUploaderVariant = "default" | "avatar" | "photos";

export interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value of the uploader.
   * @type File[]
   * @default undefined
   * @example value={files}
   */
  value?: File[];

  /**
   * Function to be called when the value changes.
   * @type React.Dispatch<React.SetStateAction<File[]>>
   * @default undefined
   * @example onValueChange={(files) => setFiles(files)}
   */
  onValueChange?: React.Dispatch<React.SetStateAction<File[]>>;

  /**
   * Function to be called when files are uploaded.
   * @type (files: File[]) => Promise<void>
   * @default undefined
   * @example onUpload={(files) => uploadFiles(files)}
   */
  onUpload?: (files: File[]) => Promise<void>;

  /**
   * Progress of the uploaded files.
   * @type Record<string, number> | undefined
   * @default undefined
   * @example progresses={{ "file1.png": 50 }}
   */
  progresses?: Record<string, number>;

  /**
   * Accepted file types for the uploader.
   * @type { [key: string]: string[]}
   * @default
   * ```ts
   * { "image/*": [] }
   * ```
   * @example accept={['image/png', 'image/jpeg']}
   */
  accept?: DropzoneProps["accept"];

  /**
   * Maximum file size for the uploader.
   * @type number | undefined
   * @default 1024 * 1024 * 2 // 2MB
   * @example maxSize={1024 * 1024 * 2} // 2MB
   */
  maxSize?: DropzoneProps["maxSize"];

  /**
   * Maximum number of files for the uploader.
   * @type number | undefined
   * @default 1
   * @example maxFiles={5}
   */
  maxFiles?: DropzoneProps["maxFiles"];

  /**
   * Whether the uploader should accept multiple files.
   * @type boolean
   * @default false
   * @example multiple
   */
  multiple?: boolean;

  /**
   * Whether the uploader is disabled.
   * @type boolean
   * @default false
   * @example disabled
   */
  disabled?: boolean;

  /**
   * Visual treatment for the dropzone and preview list.
   * @default "default"
   */
  variant?: FileUploaderVariant;

  /**
   * Override the idle-state dropzone title.
   */
  dropzoneTitle?: React.ReactNode;

  /**
   * Override the idle-state dropzone description.
   */
  dropzoneDescription?: React.ReactNode;

  /**
   * Override the drag-active dropzone title.
   */
  dragActiveTitle?: React.ReactNode;

  /**
   * Associates the hidden file input with an external label.
   */
  inputId?: string;
  /**
   * External image URL to display when no files are selected (avatar variant).
   */
  previewUrl?: string;

  /**
   * Called when the user removes the persisted preview (avatar variant).
   */
  onPreviewRemove?: () => void;
}

export function FileUploader(props: FileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    progresses,
    accept = { "image/*": [] },
    maxSize = 1024 * 1024 * 2,
    maxFiles = 1,
    multiple = false,
    disabled = false,
    variant = "default",
    dropzoneTitle,
    dropzoneDescription,
    dragActiveTitle,
    inputId,
    className,
    previewUrl,
    onPreviewRemove,
    ...dropzoneProps
  } = props;

  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
  });

  const copy = React.useMemo(
    () =>
      getUploaderCopy({
        variant,
        maxFiles,
        maxSize,
        dropzoneTitle,
        dropzoneDescription,
        dragActiveTitle,
      }),
    [dragActiveTitle, dropzoneDescription, dropzoneTitle, maxFiles, maxSize, variant],
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFiles === 1 && acceptedFiles.length > 1) {
        toast.error("Cannot upload more than 1 file at a time");
        return;
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFiles) {
        toast.error(`Cannot upload more than ${maxFiles} files`);
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      );

      const updatedFiles = files ? [...files, ...newFiles] : newFiles;

      setFiles(updatedFiles);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }) => {
          toast.error(`File ${file.name} was rejected`);
        });
      }

      if (onUpload && updatedFiles.length > 0 && updatedFiles.length <= maxFiles) {
        const target = updatedFiles.length === 1 ? "file" : `${updatedFiles.length} files`;

        toast.promise(onUpload(updatedFiles), {
          loading: `Uploading ${target}...`,
          success: () => {
            setFiles([]);
            return `${target} uploaded`;
          },
          error: `Failed to upload ${target}`,
        });
      }
    },
    [files, maxFiles, multiple, onUpload, setFiles],
  );

  function onRemove(index: number) {
    if (!files) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onValueChange?.(newFiles);
  }

  // Revoke preview url when component unmounts
  const filesRef = React.useRef(files);
  filesRef.current = files;
  // eslint-disable-next-line react-doctor/exhaustive-deps -- cleanup only, intentionally runs once
  React.useEffect(() => {
    return () => {
      const fs = filesRef.current;
      if (!fs) return;
      fs.forEach((file) => {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const isDisabled = disabled || (files?.length ?? 0) >= maxFiles;

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      {variant === "avatar" ? (
        files?.length ? null : (
          <Dropzone
            onDrop={onDrop}
            accept={accept}
            maxSize={maxSize}
            maxFiles={maxFiles}
            multiple={false}
            disabled={isDisabled}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                className={cn(
                  "group relative flex size-24 cursor-pointer items-center justify-center rounded-full transition",
                  "ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
                  !previewUrl && "bg-muted/40 hover:bg-muted/60 border-2 border-dashed",
                  isDragActive && "border-muted-foreground/50",
                  isDisabled && "pointer-events-none opacity-60",
                  className,
                )}
                {...dropzoneProps}
              >
                <input {...getInputProps({ id: inputId })} />
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Avatar"
                      width={96}
                      height={96}
                      loading="lazy"
                      className="size-full rounded-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="size-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(previewUrl, "_blank");
                        }}
                      >
                        <Icons.externalLink className="size-4" />
                        <span className="sr-only">Preview</span>
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="size-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewRemove?.();
                        }}
                      >
                        <Icons.trash className="size-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </>
                ) : isDragActive ? (
                  <Icons.upload className="text-muted-foreground size-6" aria-hidden="true" />
                ) : (
                  <Icons.user className="text-muted-foreground size-6" aria-hidden="true" />
                )}
              </div>
            )}
          </Dropzone>
        )
      ) : (
        <Dropzone
          onDrop={onDrop}
          accept={accept}
          maxSize={maxSize}
          maxFiles={maxFiles}
          multiple={maxFiles > 1 || multiple}
          disabled={isDisabled}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={cn(
                "group border-muted-foreground/25 hover:bg-muted/25 relative grid w-full cursor-pointer place-items-center border-2 border-dashed px-5 py-2.5 text-center transition",
                "ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
                variant === "photos" && "h-60 rounded-2xl",
                variant === "default" && "h-52 rounded-lg",
                isDragActive && "border-muted-foreground/50",
                isDisabled && "pointer-events-none opacity-60",
                className,
              )}
              {...dropzoneProps}
            >
              <input {...getInputProps({ id: inputId })} />
              {isDragActive ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                  <div className="rounded-full border border-dashed p-3">
                    <Icons.upload className="text-muted-foreground size-7" aria-hidden="true" />
                  </div>
                  <p className="text-muted-foreground font-medium">{copy.dragActiveTitle}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                  <div className="rounded-full border border-dashed p-3">
                    <Icons.upload className="text-muted-foreground size-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">{copy.title}</p>
                    <p className="text-muted-foreground/70 text-sm">{copy.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Dropzone>
      )}
      {files?.length ? renderPreviewList({ files, progresses, onRemove, variant }) : null}
    </div>
  );
}

interface FileCardProps {
  file: File;
  onRemove: () => void;
  progress?: number;
  variant: FileUploaderVariant;
}

function FileCard({ file, progress, onRemove, variant }: FileCardProps) {
  if (variant === "avatar") {
    const previewSrc = isFileWithPreview(file) ? file.preview : undefined;
    return (
      <div className="group relative size-24">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={file.name}
            width={96}
            height={96}
            loading="lazy"
            className="size-full rounded-full object-cover"
          />
        ) : null}
        {progress !== undefined && progress < 100 ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Progress value={progress} className="w-16" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {previewSrc ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-8 rounded-full"
                onClick={() => window.open(previewSrc, "_blank")}
              >
                <Icons.externalLink className="size-4" />
                <span className="sr-only">Preview</span>
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="size-8 rounded-full"
              onClick={onRemove}
            >
              <Icons.trash className="size-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (variant === "photos") {
    const previewSrc = isFileWithPreview(file) ? file.preview : undefined;
    return (
      <div className="group border-border bg-card relative overflow-hidden rounded-2xl border">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={file.name}
            width={320}
            height={240}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : null}
        {progress !== undefined && progress < 100 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Progress value={progress} className="w-24" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {previewSrc ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-8 rounded-full"
                onClick={() => window.open(previewSrc, "_blank")}
              >
                <Icons.externalLink className="size-4" />
                <span className="sr-only">Preview</span>
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="size-8 rounded-full"
              onClick={onRemove}
            >
              <Icons.trash className="size-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center space-x-4">
      <div className="flex flex-1 space-x-4">
        {isFileWithPreview(file) ? (
          <img
            src={file.preview}
            alt={file.name}
            width={48}
            height={48}
            loading="lazy"
            className="aspect-square shrink-0 rounded-md object-cover"
          />
        ) : null}
        <div className="flex w-full flex-col gap-2">
          <div className="space-y-px">
            <p className="text-foreground/80 line-clamp-1 text-sm font-medium">{file.name}</p>
            <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
          </div>
          {progress ? <Progress value={progress} /> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={progress !== undefined && progress < 100}
          className="size-8 rounded-full"
        >
          <Icons.close className="text-muted-foreground" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    </div>
  );
}

function renderPreviewList({
  files,
  progresses,
  onRemove,
  variant,
}: {
  files: File[];
  progresses?: Record<string, number>;
  onRemove: (index: number) => void;
  variant: FileUploaderVariant;
}) {
  if (variant === "avatar") {
    return (
      <div className="px-1">
        <FileCard
          key={files[0]?.name ?? "avatar"}
          file={files[0]!}
          onRemove={() => onRemove(0)}
          progress={files[0] ? progresses?.[files[0].name] : undefined}
          variant={variant}
        />
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-fit w-full", variant === "default" ? "px-3" : "pr-2")}>
      <div
        className={cn(
          variant === "photos"
            ? "grid max-h-80 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "max-h-48 space-y-4",
        )}
      >
        {files.map((file, index) => (
          <FileCard
            key={`${file.name}-${index}`}
            file={file}
            onRemove={() => onRemove(index)}
            progress={progresses?.[file.name]}
            variant={variant}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function getUploaderCopy({
  variant,
  maxFiles,
  maxSize,
  dropzoneTitle,
  dropzoneDescription,
  dragActiveTitle,
}: {
  variant: FileUploaderVariant;
  maxFiles: number;
  maxSize: number;
  dropzoneTitle?: React.ReactNode;
  dropzoneDescription?: React.ReactNode;
  dragActiveTitle?: React.ReactNode;
}) {
  if (variant === "avatar") {
    return {
      title: dropzoneTitle ?? `Drag 'n' drop a profile photo here, or click to select one`,
      description: dropzoneDescription ?? `Upload one image up to ${formatBytes(maxSize)}`,
      dragActiveTitle: dragActiveTitle ?? "Drop the photo here",
    };
  }

  if (variant === "photos") {
    return {
      title: dropzoneTitle ?? `Drag 'n' drop photos here, or click to select images`,
      description:
        dropzoneDescription ??
        `Upload up to ${maxFiles === Infinity ? "multiple" : maxFiles} photos (${formatBytes(maxSize)} each)`,
      dragActiveTitle: dragActiveTitle ?? "Drop the photos here",
    };
  }

  return {
    title: dropzoneTitle ?? `Drag 'n' drop files here, or click to select files`,
    description:
      dropzoneDescription ??
      (maxFiles > 1
        ? `You can upload ${maxFiles === Infinity ? "multiple" : maxFiles} files (up to ${formatBytes(maxSize)} each)`
        : `You can upload a file with ${formatBytes(maxSize)}`),
    dragActiveTitle: dragActiveTitle ?? "Drop the files here",
  };
}

function isFileWithPreview(file: File): file is File & { preview: string } {
  return "preview" in file && typeof file.preview === "string";
}
