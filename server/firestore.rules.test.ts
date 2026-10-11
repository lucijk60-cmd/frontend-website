import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Firestore Security Rules — Dirty Dozen & Eight Pillars verification", () => {
  const rulesPath = path.resolve(process.cwd(), "firestore.rules");

  it("enforces rules_version 2 and global default-deny catch-all", () => {
    const content = fs.readFileSync(rulesPath, "utf8");
    expect(content).toContain("rules_version = '2';");
    expect(content).toContain("match /{document=**}");
    expect(content).toContain("allow read, write: if false;");
  });

  it("enforces email_verified, isValidId, and validation helpers on all collections", () => {
    const content = fs.readFileSync(rulesPath, "utf8");
    expect(content).toContain("request.auth.token.email_verified == true");
    expect(content).toContain("function isValidId(id)");
    expect(content).toContain("function isValidReview(data)");
    expect(content).toContain("function isValidAdminMedia(data)");
    expect(content).toContain("function isValidVisitorEvent(data)");
    expect(content).toContain("function isValidCallSession(data)");
    expect(content).toContain("affectedKeys().hasOnly");
  });
});
