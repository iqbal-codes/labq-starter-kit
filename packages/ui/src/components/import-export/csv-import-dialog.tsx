"use client";

import * as React from "react";
import type { z } from "zod";
import { toast } from "sonner";
import { parseCsvFile, downloadCsv } from "../../lib/csv";
import { FileUploader } from "../file-uploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../table";
import { ScrollArea } from "../scroll-area";

export interface CsvColumnDefinition {
  key: string;
  label: string;
  required: boolean;
}

export interface CsvImportError<TRow extends Record<string, unknown>> {
  rowNumber: number;
  message: string;
  values: TRow;
}

export interface CsvImportResult<TRow extends Record<string, unknown>> {
  importBatchId: string;
  successCount: number;
  errorCount: number;
  errors: CsvImportError<TRow>[];
}

export interface CsvImportDialogProps<TRow extends Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  columns: readonly CsvColumnDefinition[];
  schema: z.ZodType<TRow>;
  templateFilename: string;
  onImport: (rows: TRow[]) => Promise<CsvImportResult<TRow>>;
}

function normalizeCsvHeader(header: string): string {
  return header.trim().toLowerCase();
}

type DialogPhase = "upload" | "preview" | "importing" | "result";

export function CsvImportDialog<TRow extends Record<string, unknown>>(
  props: CsvImportDialogProps<TRow>,
) {
  const { open, onOpenChange, title, description, columns, schema, templateFilename, onImport } =
    props;

  const [files, setFiles] = React.useState<File[]>([]);
  const [phase, setPhase] = React.useState<DialogPhase>("upload");
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rawRows, setRawRows] = React.useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [parsedRows, setParsedRows] = React.useState<TRow[]>([]);
  const [serverResult, setServerResult] = React.useState<CsvImportResult<TRow> | null>(null);

  const reset = React.useCallback(() => {
    setFiles([]);
    setPhase("upload");
    setParseError(null);
    setHeaders([]);
    setRawRows([]);
    setValidationErrors([]);
    setParsedRows([]);
    setServerResult(null);
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset();
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  const requiredKeys = React.useMemo(() => {
    const keys: string[] = [];
    for (const c of columns) if (c.required) keys.push(c.key);
    return keys;
  }, [columns]);

  // Process file when selected
  React.useEffect(() => {
    if (files.length === 0) return;
    const file = files[0]!;
    let cancelled = false;

    void (async () => {
      try {
        const result = await parseCsvFile(file);
        if (cancelled) return;

        setHeaders(result.headers);
        setRawRows(result.rows);
        setParseError(null);

        // Check required headers
        const normalizedProvided = result.headers.map(normalizeCsvHeader);
        const missingRequired = requiredKeys.filter(
          (key) => !normalizedProvided.includes(normalizeCsvHeader(key)),
        );
        if (missingRequired.length > 0) {
          setParseError(`Missing required columns: ${missingRequired.join(", ")}`);
          setPhase("preview");
          return;
        }

        // Check duplicate normalized headers
        const seen = new Map<string, string[]>();
        for (const h of result.headers) {
          const norm = normalizeCsvHeader(h);
          const existing = seen.get(norm) ?? [];
          existing.push(h);
          seen.set(norm, existing);
        }
        const duplicates = [...seen.entries()].filter(([, v]) => v.length > 1);
        if (duplicates.length > 0) {
          setParseError(
            `Duplicate columns found: ${duplicates.map(([, v]) => `"${v.join('", "')}"`).join("; ")}`,
          );
          setPhase("preview");
          return;
        }

        // Map rows: normalize blank optional cells to undefined, trim strings
        const columnKeys = columns.map((c) => c.key);
        const normalizedMap = new Map<string, string>();
        for (const h of result.headers) {
          normalizedMap.set(normalizeCsvHeader(h), h);
        }

        const mappedRows: TRow[] = [];
        const rowValidationErrors: string[] = [];
        const maxPreview = 25;

        for (let i = 0; i < Math.min(result.rows.length, maxPreview); i++) {
          const rawRow = result.rows[i]!;
          const mapped: Record<string, unknown> = {};

          for (const col of columnKeys) {
            const rawKey = normalizedMap.get(col);
            const val = rawKey ? rawRow[rawKey] : undefined;
            mapped[col] = val === "" || val === undefined ? undefined : val;
          }

          const parsed = schema.safeParse(mapped);
          if (parsed.success) {
            mappedRows.push(parsed.data);
          } else {
            const msg = parsed.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; ");
            rowValidationErrors.push(`Row ${i + 2}: ${msg}`);
          }
        }

        if (!cancelled) {
          setParsedRows(mappedRows);
          setValidationErrors(rowValidationErrors);
          setPhase("preview");
        }
      } catch (err) {
        if (!cancelled) {
          setParseError(err instanceof Error ? err.message : "Failed to parse CSV");
          setPhase("preview");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [files, columns, schema, requiredKeys]);

  const handleDownloadTemplate = React.useCallback(() => {
    downloadCsv({
      filename: templateFilename,
      headers: columns.map((c) => c.key),
      rows: [],
    });
  }, [templateFilename, columns]);

  const handleConfirmImport = React.useCallback(async () => {
    setPhase("importing");
    try {
      const result = await onImport(parsedRows);
      setServerResult(result);
      setPhase("result");
      if (result.errorCount === 0) {
        toast.success(`Imported ${result.successCount} records`);
        handleOpenChange(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast.error(message);
      setPhase("preview");
    }
  }, [onImport, parsedRows, handleOpenChange]);

  const handleDownloadErrors = React.useCallback(() => {
    if (!serverResult || serverResult.errors.length === 0) return;
    const errorRows = serverResult.errors.map((e) => ({
      rowNumber: e.rowNumber,
      error: e.message,
      ...e.values,
    }));
    const allHeaders = ["rowNumber", "error", ...columns.map((c) => c.key)];
    downloadCsv({ filename: "import-errors.csv", headers: allHeaders, rows: errorRows });
  }, [serverResult, columns]);

  const hasParseError = parseError !== null;
  const hasValidationErrors = validationErrors.length > 0;
  const canImport = !hasParseError && !hasValidationErrors && parsedRows.length > 0;
  const showRowLimitNote = rawRows.length > 25;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {phase === "upload" && (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              Download template
            </Button>
            <FileUploader
              value={files}
              onValueChange={setFiles}
              accept={{ "text/csv": [".csv"] }}
              maxFiles={1}
              multiple={false}
            />
          </div>
        )}

        {phase === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                Download template
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  reset();
                }}
              >
                Upload different file
              </Button>
            </div>

            {hasParseError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {parseError}
              </div>
            )}

            {hasValidationErrors && (
              <div className="space-y-2">
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Validation errors:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {validationErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!hasParseError && rawRows.length > 0 && (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawRows.slice(0, 25).map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((col) => {
                          const rawKey = headers.find((h) => normalizeCsvHeader(h) === col.key);
                          const val = rawKey ? (row[rawKey] ?? "") : "";
                          return <TableCell key={col.key}>{val}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {showRowLimitNote && (
              <p className="text-xs text-muted-foreground">
                Previewing first 25 of {rawRows.length} rows
              </p>
            )}

            {serverResult && serverResult.errorCount > 0 && (
              <div className="space-y-2">
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">
                    {serverResult.successCount} imported, {serverResult.errorCount} failed
                  </p>
                  {serverResult.errors.slice(0, 10).map((err) => (
                    <p key={err.rowNumber} className="mt-1">
                      Row {err.rowNumber}: {err.message}
                    </p>
                  ))}
                  {serverResult.errors.length > 10 && (
                    <p className="mt-1">...and {serverResult.errors.length - 10} more errors</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadErrors}>
                  Download error report
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === "importing" && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Importing records...</p>
          </div>
        )}

        {phase === "result" && serverResult && serverResult.errorCount === 0 && null}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          {phase === "preview" && (
            <Button onClick={handleConfirmImport} disabled={!canImport}>
              Import {parsedRows.length} {parsedRows.length === 1 ? "record" : "records"}
            </Button>
          )}
          {phase === "result" && serverResult && serverResult.errorCount > 0 && (
            <Button variant="outline" onClick={handleDownloadErrors}>
              Download error report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
