import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, adminSessionProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { clearAdminSessionCookie, createAdminSession, setAdminSessionCookie, verifyAdminCredentials } from "./adminAuth";
import { createAdminMedia, createAdminMediaPair, getAdminMedia, getAdminMediaById, getPublishedAdminMedia, updateAdminMedia, updateAdminMediaStatus } from "./db";
import { storagePut } from "./storage";
import { createReview, getApprovedReviewCount, getApprovedReviews, getPendingReviews, hasDuplicateReview, updateReviewStatus } from "./db";

const gateAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_GATE_ATTEMPTS = 5;
const GATE_WINDOW_MS = 10 * 60 * 1000;

function getRequestKey(req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers?.["x-forwarded-for"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() || req.ip || "unknown";
}

function assertGateRateLimit(req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const now = Date.now();
  const key = getRequestKey(req);
  const previous = gateAttempts.get(key);
  if (!previous || previous.resetAt <= now) {
    gateAttempts.set(key, { count: 0, resetAt: now + GATE_WINDOW_MS });
    return;
  }
  if (previous.count >= MAX_GATE_ATTEMPTS) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." });
  }
}

function registerGateFailure(req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const key = getRequestKey(req);
  const current = gateAttempts.get(key) ?? { count: 0, resetAt: Date.now() + GATE_WINDOW_MS };
  gateAttempts.set(key, { ...current, count: current.count + 1 });
}

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || "upload";
}

const uploadInput = z.object({
  kind: z.enum(["image", "video"]),
  language: z.enum(["en", "ar", "shared"]),
  pairKey: z.string().trim().min(8).max(96).optional(),
  title: z.string().trim().min(2).max(180),
  fileName: z.string().min(1).max(180).regex(/^[^\\/\\\\]+\\.[a-zA-Z0-9]{2,5}$/, "A valid file extension is required."),
  mimeType: z.string().min(3).max(120),
  dataBase64: z.string().min(20).max(42_000_000),
  publish: z.boolean().default(false),
});

const pairedAssetInput = z.object({
  fileName: z.string().min(1).max(180).regex(/^[^\\/\\\\]+\\.[a-zA-Z0-9]{2,5}$/, "A valid file extension is required."),
  mimeType: z.string().min(3).max(120),
  dataBase64: z.string().min(20).max(42_000_000),
});

const pairedUploadInput = z.object({
  kind: z.enum(["image", "video"]),
  title: z.string().trim().min(2).max(180),
  english: pairedAssetInput.optional(),
  arabic: pairedAssetInput.optional(),
  publish: z.boolean().default(false),
}).refine(input => Boolean(input.english || input.arabic), { message: "Select an English or Arabic asset before uploading." });

export function validateUpload(input: z.infer<typeof uploadInput>, byteLength: number) {
  const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  const videoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
  const extension = input.fileName.split(".").pop()?.toLowerCase();
  const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
  const videoExtensions = new Set(["mp4", "webm", "mov"]);
  const validExtension = input.kind === "image" ? imageExtensions.has(extension ?? "") : videoExtensions.has(extension ?? "");
  const validType = input.kind === "image" ? imageTypes.has(input.mimeType) : videoTypes.has(input.mimeType);
  const maxBytes = input.kind === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
  if (!validType || !validExtension || byteLength > maxBytes) {
    throw new TRPCError({ code: "BAD_REQUEST", message: input.kind === "image" ? "Use a supported image under 10 MB." : "Use an MP4, WebM, or MOV video under 50 MB." });
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  admin: router({
    verifyGate: publicProcedure.input(z.object({
      password: z.string().min(1).max(200),
      ppfPassword: z.string().min(1).max(200),
      adminPassword: z.string().min(1).max(200),
      privatePassword: z.string().min(1).max(200),
    })).mutation(async ({ input, ctx }) => {
      assertGateRateLimit(ctx.req);
      if (!verifyAdminCredentials(input)) {
        registerGateFailure(ctx.req);
        throw new TRPCError({ code: "FORBIDDEN", message: "The four passwords do not match." });
      }
      gateAttempts.delete(getRequestKey(ctx.req));
      const token = await createAdminSession();
      setAdminSessionCookie(ctx.req, ctx.res, token);
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearAdminSessionCookie(ctx.req, ctx.res);
      return { success: true } as const;
    }),
    media: router({
      published: publicProcedure.query(() => getPublishedAdminMedia()),
      list: adminSessionProcedure.query(() => getAdminMedia()),
      uploadPair: adminSessionProcedure.input(pairedUploadInput).mutation(async ({ input }) => {
        const pairKey = `ppfstudio-${Date.now()}-${randomUUID().slice(0, 8)}`;
        const assets = ([{ language: "en" as const, file: input.english }, { language: "ar" as const, file: input.arabic }])
          .filter((entry): entry is { language: "en" | "ar"; file: z.infer<typeof pairedAssetInput> } => Boolean(entry.file));
        const rows = [];
        for (const asset of assets) {
          const buffer = Buffer.from(asset.file.dataBase64, "base64");
          const singleInput = { ...asset.file, kind: input.kind, language: asset.language, title: input.title, publish: input.publish };
          validateUpload(singleInput, buffer.byteLength);
          const storagePath = `admin-media/${input.kind}/${asset.language}/${pairKey}-${sanitizeFileName(asset.file.fileName)}`;
          const stored = await storagePut(storagePath, buffer, asset.file.mimeType);
          rows.push({ kind: input.kind, language: asset.language, pairKey, title: input.title, storageKey: stored.key, url: stored.url, mimeType: asset.file.mimeType, sizeBytes: buffer.byteLength, status: input.publish ? "published" as const : "draft" as const });
        }
        return createAdminMediaPair(rows);
      }),
      upload: adminSessionProcedure.input(uploadInput).mutation(async ({ input }) => {
        const buffer = Buffer.from(input.dataBase64, "base64");
        validateUpload(input, buffer.byteLength);
        const storagePath = `admin-media/${input.kind}/${input.language}/${input.pairKey ? `${input.pairKey}-` : ""}${Date.now()}-${sanitizeFileName(input.fileName)}`;
        const stored = await storagePut(storagePath, buffer, input.mimeType);
        const result = await createAdminMedia({
          kind: input.kind,
          language: input.language,
          pairKey: input.pairKey,
          title: input.title,
          storageKey: stored.key,
          url: stored.url,
          mimeType: input.mimeType,
          sizeBytes: buffer.byteLength,
          status: input.publish ? "published" : "draft",
        });
        return { ...result, url: stored.url };
      }),
      update: adminSessionProcedure.input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(2).max(180).optional(),
        status: z.enum(["draft", "published"]).optional(),
      })).mutation(async ({ input }) => {
        const existing = await getAdminMediaById(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Media asset not found." });
        return updateAdminMedia(input.id, { ...(input.title !== undefined ? { title: input.title } : {}), ...(input.status !== undefined ? { status: input.status } : {}) });
      }),
      replace: adminSessionProcedure.input(z.object({
        id: z.number().int().positive(),
        fileName: z.string().min(1).max(180).regex(/^[^\\/\\\\]+\\.[a-zA-Z0-9]{2,5}$/, "A valid file extension is required."),
        mimeType: z.string().min(3).max(120),
        dataBase64: z.string().min(20).max(42_000_000),
      })).mutation(async ({ input }) => {
        const existing = await getAdminMediaById(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Media asset not found." });
        const replacement = { ...existing, pairKey: existing.pairKey ?? undefined, fileName: input.fileName, mimeType: input.mimeType, dataBase64: input.dataBase64, publish: existing.status === "published" };
        const buffer = Buffer.from(input.dataBase64, "base64");
        validateUpload(replacement, buffer.byteLength);
        const storagePath = `admin-media/${existing.kind}/${existing.language}/${existing.pairKey ? `${existing.pairKey}-` : ""}${Date.now()}-${sanitizeFileName(input.fileName)}`;
        const stored = await storagePut(storagePath, buffer, input.mimeType);
        await updateAdminMedia(input.id, { storageKey: stored.key, url: stored.url, mimeType: input.mimeType, sizeBytes: buffer.byteLength });
        return { success: true, url: stored.url } as const;
      }),
      setStatus: adminSessionProcedure.input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["draft", "published"]),
      })).mutation(({ input }) => updateAdminMediaStatus(input.id, input.status)),
    }),
  }),

  reviews: router({
    list: publicProcedure.input(z.object({
      limit: z.number().int().min(1).max(50).default(24),
      offset: z.number().int().min(0).default(0),
    }).optional()).query(async ({ input }) => {
      const { limit = 24, offset = 0 } = input ?? {};
      const [items, total] = await Promise.all([getApprovedReviews(limit, offset), getApprovedReviewCount()]);
      return { items, total };
    }),
    submit: publicProcedure.input(z.object({
      name: z.string().trim().min(2).max(120),
      vehicle: z.string().trim().max(120).optional(),
      rating: z.number().int().min(1).max(5),
      review: z.string().trim().min(20).max(1000),
    })).mutation(async ({ input }) => {
      if (await hasDuplicateReview(input.name, input.review)) {
        throw new Error("A matching review has already been submitted.");
      }
      return createReview({ ...input, status: "pending" });
    }),
    pending: adminProcedure.query(() => getPendingReviews()),
    moderate: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["approved", "rejected"]),
    })).mutation(({ input, ctx }) => updateReviewStatus(input.id, input.status, ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
