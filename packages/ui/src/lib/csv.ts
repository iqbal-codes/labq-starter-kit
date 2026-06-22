import * as Papa from "papaparse";

function createResolvers<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export async function parseCsvFile(
  file: File,
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const { promise, resolve, reject } = createResolvers<{
    headers: string[];
    rows: Record<string, string>[];
  }>();

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      if (results.errors.length > 0) {
        reject(new Error(`CSV parse error: ${results.errors.map((e) => e.message).join("; ")}`));
        return;
      }

      const rawHeaders = results.meta.fields ?? [];
      const headers = rawHeaders.map((h) => h.trim());

      const rows = (results.data as Record<string, string>[]).map((row) => {
        const normalized: Record<string, string> = {};
        for (const key of Object.keys(row)) {
          normalized[key.trim()] =
            typeof row[key] === "string" ? row[key].trim() : (row[key] ?? "");
        }
        return normalized;
      });

      resolve({ headers, rows });
    },
    error(err) {
      reject(err);
    },
  });

  return promise;
}

export function downloadCsv(options: {
  filename: string;
  headers: readonly string[];
  rows: readonly Record<string, unknown>[];
}): void {
  const { filename, headers, rows } = options;
  const csv = Papa.unparse({
    fields: [...headers],
    data: rows.map((row) => [...headers].map((h) => row[h] ?? "")),
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
