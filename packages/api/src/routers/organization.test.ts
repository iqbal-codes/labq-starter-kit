import { describe, it, expect } from "vite-plus/test";
import { slugifyOrganizationName } from "./organization";

describe("slugifyOrganizationName", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugifyOrganizationName("Acme Labs!")).toBe("acme-labs");
  });

  it("strips diacritics and trims", () => {
    expect(slugifyOrganizationName("  Café Déjà Vu  ")).toBe("cafe-deja-vu");
  });

  it("returns 'organization' when no alphanumeric chars remain", () => {
    expect(slugifyOrganizationName("!!!")).toBe("organization");
  });
});
