import { parse } from "cookie";
import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";

export const ADMIN_SESSION_COOKIE = "ppfstudio_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "development-only-secret");
}

function safeEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function verifyAdminCredentials(input: {
  password: string;
  ppfPassword: string;
  adminPassword?: string;
  privatePassword?: string;
}) {
  const firstTwo = [process.env.ADMIN_GATE_PASSWORD, process.env.PPF_GATE_PASSWORD];
  if (firstTwo.some(value => !value)) return false;

  // The public Admin screen uses the first two configured secrets. The optional
  // legacy fields remain supported for existing credentialed integrations.
  if (!input.adminPassword && !input.privatePassword) {
    return [input.password, input.ppfPassword]
      .every((value, index) => safeEqual(value, firstTwo[index] as string));
  }

  const allFour = [...firstTwo, process.env.ADMIN_PANEL_PASSWORD, process.env.PRIVATE_ACCESS_PASSWORD];
  if (allFour.some(value => !value)) return false;
  return [input.password, input.ppfPassword, input.adminPassword, input.privatePassword]
    .every((value, index) => typeof value === "string" && typeof allFour[index] === "string" && safeEqual(value, allFour[index]));
}

export async function createAdminSession() {
  return new SignJWT({ scope: "admin", version: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function isAdminSession(req: Request) {
  const token = parse(req.headers.cookie ?? "")[ADMIN_SESSION_COOKIE];
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.scope === "admin";
  } catch {
    return false;
  }
}

export function setAdminSessionCookie(req: Request, res: Response, token: string) {
  const options = getSessionCookieOptions(req);
  res.cookie(ADMIN_SESSION_COOKIE, token, {
    ...options,
    maxAge: SESSION_TTL_SECONDS * 1000,
    sameSite: "none",
  });
}

export function clearAdminSessionCookie(req: Request, res: Response) {
  const options = getSessionCookieOptions(req);
  res.cookie(ADMIN_SESSION_COOKIE, "", {
    ...options,
    maxAge: 0,
    sameSite: "none",
  });
}
