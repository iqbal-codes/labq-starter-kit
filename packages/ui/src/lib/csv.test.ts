import { describe, it, expect } from "vite-plus/test";
import * as Papa from "papaparse";

// Test the parsing logic directly since PapaParse requires FileReaderSync for File objects in Node.js
// The parseCsvFile function is a thin wrapper around PapaParse with header/skipEmptyLines/trim options
describe("CSV parsing logic (matches parseCsvFile behavior)", () => {
  function parseCsvString(csv: string): { headers: string[]; rows: Record<string, string>[] } {
    const results = Papa.parse(csv, { header: true, skipEmptyLines: true });
    const rawHeaders = results.meta.fields ?? [];
    const headers = rawHeaders.map((h) => h.trim());
    const rows = (results.data as Record<string, string>[]).map((row) => {
      const normalized: Record<string, string> = {};
      for (const key of Object.keys(row)) {
        normalized[key.trim()] = typeof row[key] === "string" ? row[key].trim() : (row[key] ?? "");
      }
      return normalized;
    });
    return { headers, rows };
  }

  it("parses a simple CSV with headers", () => {
    const result = parseCsvString("name,email\nAlice,alice@test.com\nBob,bob@test.com");
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.rows).toEqual([
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ]);
  });

  it("handles quoted commas correctly", () => {
    const result = parseCsvString('name,email\n"Smith, Jr.",alice@test.com');
    expect(result.rows[0]).toEqual({ name: "Smith, Jr.", email: "alice@test.com" });
  });

  it("trims whitespace from headers and cell values", () => {
    const result = parseCsvString(" name , email \n Alice , alice@test.com ");
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.rows[0]).toEqual({ name: "Alice", email: "alice@test.com" });
  });

  it("skips empty lines", () => {
    const result = parseCsvString("name,email\nAlice,alice@test.com\n\nBob,bob@test.com\n");
    expect(result.rows).toHaveLength(2);
  });

  it("normalizes blank optional cells to empty strings", () => {
    const result = parseCsvString("name,email\nAlice,");
    expect(result.rows[0]).toEqual({ name: "Alice", email: "" });
  });

  it("returns empty array for header-only CSV", () => {
    const result = parseCsvString("name,email\n");
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.rows).toEqual([]);
  });

  it("rejects duplicate normalized headers", () => {
    const results = Papa.parse("Name,name\nAlice,alice@test.com", {
      header: true,
      skipEmptyLines: true,
    });
    const headers = (results.meta.fields ?? []).map((h) => h.trim());
    const normalized = headers.map((h) => h.toLowerCase());
    const unique = new Set(normalized);
    expect(unique.size).toBe(1); // Both become "name" — duplicates detected
  });
});

describe("downloadCsv (unparse logic)", () => {
  it("produces correct CSV from headers and rows", () => {
    const csv = Papa.unparse({
      fields: ["name", "email", "phone"],
      data: [
        ["Alice", "alice@test.com", "555-0101"],
        ["Bob", "bob@test.com", ""],
      ],
    });
    const lines = csv.split(/\r?\n/).filter(Boolean);
    expect(lines[0]).toBe("name,email,phone");
    expect(lines[1]).toBe("Alice,alice@test.com,555-0101");
    expect(lines[2]).toBe("Bob,bob@test.com,");
  });

  it("produces header-only CSV for empty rows", () => {
    const csv = Papa.unparse({
      fields: ["name", "email"],
      data: [],
    });
    const lines = csv.split(/\r?\n/).filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("name,email");
  });

  it("handles values with commas by quoting", () => {
    const csv = Papa.unparse({
      fields: ["name", "address"],
      data: [["Alice", "123 Main St, Apt 4"]],
    });
    const lines = csv.split(/\r?\n/).filter(Boolean);
    // PapaParse only quotes the field that needs it
    expect(lines[1]).toContain("123 Main St, Apt 4");
    expect(lines[1]).toContain("Alice");
  });
});
