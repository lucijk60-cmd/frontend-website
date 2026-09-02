import { describe, expect, it } from "vitest";
import fs from "node:fs";

const legalSource = fs.readFileSync(new URL("../pages/LegalPages.tsx", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

 describe("PPFStudio legal pages", () => {
  it("contains bilingual privacy and terms content without invented business contact details", () => {
    expect(legalSource).toContain("Privacy Policy");
    expect(legalSource).toContain("سياسة الخصوصية");
    expect(legalSource).toContain("Terms of Service");
    expect(legalSource).toContain("شروط الخدمة");
    expect(legalSource).toContain("+966 53 735 8631");
    expect(legalSource).toContain("No postal address or email address is listed because those details have not been confirmed.");
  });

  it("registers all public legal routes", () => {
    expect(appSource).toContain('path="/privacy"');
    expect(appSource).toContain('path="/terms"');
    expect(appSource).toContain('path="/contact"');
  });
});
