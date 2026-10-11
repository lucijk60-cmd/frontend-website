import { drizzle } from "drizzle-orm/mysql2";
import { createHash } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { AdminMedia, CallSession, InsertAdminMedia, InsertReview, InsertUser, InsertVisitorEvent, adminMedia, callBusinesses, callSessions, reviews, users, visitorEvents } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory mock fallback when DATABASE_URL is not configured or unreachable
const memoryStore = {
  users: new Map<string, any>(),
  visitorEvents: [] as Array<InsertVisitorEvent & { id: number; createdAt: Date }>,
  callBusinesses: new Map<string, any>(),
  callSessions: new Map<string, CallSession>(),
  reviews: [] as Array<any>,
  adminMedia: [] as Array<AdminMedia>,
  nextId: 1,
};

function hasValidDatabaseUrl(url: string | undefined): url is string {
  if (!url) return false;
  if (url === "Secret value" || url.includes("USER:PASSWORD@HOST") || url.includes("example.invalid")) {
    return false;
  }
  return url.startsWith("mysql://") || url.startsWith("mysql2://");
}

let dbMocked = false;
let db: any;
try {
  if (hasValidDatabaseUrl(process.env.DATABASE_URL)) {
    db = drizzle(process.env.DATABASE_URL);
    _db = db;
  } else {
    throw new Error("DATABASE_URL not set or placeholder");
  }
} catch {
  console.warn("[AI Studio] Database not connected — using mock");
  dbMocked = true;
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  db = new Proxy(
    {},
    {
      get: (_, prop) =>
        prop === "query" ? new Proxy({}, { get: () => noOp }) : async () => [],
    }
  );
}
export { db };

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (dbMocked) return null;
  if (!_db && hasValidDatabaseUrl(process.env.DATABASE_URL)) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      dbMocked = true;
    }
  }
  return _db;
}

export async function recordVisitorEvent(input: Omit<InsertVisitorEvent, "id" | "createdAt">) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    memoryStore.visitorEvents.push({
      ...input,
      id: memoryStore.nextId++,
      createdAt: new Date(),
    });
    return;
  }
  try {
    await dbInstance.insert(visitorEvents).values(input);
  } catch {
    dbMocked = true;
    memoryStore.visitorEvents.push({
      ...input,
      id: memoryStore.nextId++,
      createdAt: new Date(),
    });
  }
}

export function hashVisitorKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function getVisitorAnalytics() {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const uniqueSet = new Set(memoryStore.visitorEvents.map(e => e.visitorKeyHash));
    const countryCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();
    const dateCounts = new Map<string, number>();
    for (const ev of memoryStore.visitorEvents) {
      const cc = ev.countryCode || "UNKNOWN";
      countryCounts.set(cc, (countryCounts.get(cc) ?? 0) + 1);
      const dc = ev.deviceClass || "unknown";
      deviceCounts.set(dc, (deviceCounts.get(dc) ?? 0) + 1);
      const dt = ev.createdAt.toISOString().slice(0, 10);
      dateCounts.set(dt, (dateCounts.get(dt) ?? 0) + 1);
    }
    return {
      totalViews: memoryStore.visitorEvents.length,
      uniqueVisitors: uniqueSet.size,
      byCountry: Array.from(countryCounts.entries()).map(([countryCode, views]) => ({ countryCode, views })).sort((a, b) => b.views - a.views).slice(0, 10),
      byDevice: Array.from(deviceCounts.entries()).map(([deviceClass, views]) => ({ deviceClass, views })).sort((a, b) => b.views - a.views),
      recentViews: Array.from(dateCounts.entries()).map(([date, views]) => ({ date, views })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14),
    };
  }
  try {
    const [totals, byCountry, byDevice, recentViews] = await Promise.all([
      dbInstance.select({ totalViews: sql<number>`count(*)`, uniqueVisitors: sql<number>`count(distinct ${visitorEvents.visitorKeyHash})` }).from(visitorEvents),
      dbInstance.select({ countryCode: visitorEvents.countryCode, views: sql<number>`count(*)` }).from(visitorEvents).groupBy(visitorEvents.countryCode).orderBy(desc(sql`count(*)`)).limit(10),
      dbInstance.select({ deviceClass: visitorEvents.deviceClass, views: sql<number>`count(*)` }).from(visitorEvents).groupBy(visitorEvents.deviceClass).orderBy(desc(sql`count(*)`)),
      dbInstance.select({ date: sql<string>`date(${visitorEvents.createdAt})`, views: sql<number>`count(*)` }).from(visitorEvents).groupBy(sql`date(${visitorEvents.createdAt})`).orderBy(desc(sql`date(${visitorEvents.createdAt})`)).limit(14),
    ]);
    const summary = totals[0] ?? { totalViews: 0, uniqueVisitors: 0 };
    return {
      totalViews: Number(summary.totalViews ?? 0),
      uniqueVisitors: Number(summary.uniqueVisitors ?? 0),
      byCountry: byCountry.map(item => ({ countryCode: item.countryCode, views: Number(item.views ?? 0) })),
      byDevice: byDevice.map(item => ({ deviceClass: item.deviceClass, views: Number(item.views ?? 0) })),
      recentViews: recentViews.map(item => ({ date: item.date, views: Number(item.views ?? 0) })),
    };
  } catch {
    dbMocked = true;
    return { totalViews: 0, uniqueVisitors: 0, byCountry: [], byDevice: [], recentViews: [] };
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const dbInstance = await getDb();
  if (!dbInstance) {
    const existing = memoryStore.users.get(user.openId) ?? { id: memoryStore.nextId++, createdAt: new Date() };
    memoryStore.users.set(user.openId, {
      ...existing,
      ...user,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : existing.role ?? "user"),
      lastSignedIn: user.lastSignedIn ?? new Date(),
      updatedAt: new Date(),
    });
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await dbInstance.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
  }
}

export async function getUserByOpenId(openId: string) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return memoryStore.users.get(openId);
  }

  try {
    const result = await dbInstance.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch {
    dbMocked = true;
    return memoryStore.users.get(openId);
  }
}

export async function ensureCallBusiness(businessId: string, name = "PPF Studio") {
  const dbInstance = await getDb();
  if (!dbInstance) {
    memoryStore.callBusinesses.set(businessId, { businessId, name, status: "active" });
    return;
  }
  await dbInstance.insert(callBusinesses).values({ businessId, name, status: "active" }).onDuplicateKeyUpdate({
    set: { name, status: "active" },
  });
}

export async function createCallSession(session: typeof callSessions.$inferInsert) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const id = memoryStore.nextId++;
    const now = new Date();
    memoryStore.callSessions.set(session.callId, {
      id,
      callId: session.callId,
      businessId: session.businessId,
      operatorId: session.operatorId ?? "PPFSTUDIO001",
      callerSessionId: session.callerSessionId ?? null,
      customerTokenHash: session.customerTokenHash,
      status: session.status ?? "calling",
      startedAt: session.startedAt ?? null,
      endedAt: session.endedAt ?? null,
      durationSeconds: session.durationSeconds ?? null,
      endReason: session.endReason ?? null,
      lastSignalAt: session.lastSignalAt ?? now,
      createdAt: now,
      updatedAt: now,
    });
    return { id, callId: session.callId };
  }
  const [result] = await dbInstance.insert(callSessions).values(session);
  return { id: result.insertId, callId: session.callId };
}

export async function getCallSessionByCallId(callId: string) {
  const dbInstance = await getDb();
  if (!dbInstance) return memoryStore.callSessions.get(callId);
  const [result] = await dbInstance.select().from(callSessions).where(eq(callSessions.callId, callId)).limit(1);
  return result;
}

export async function updateCallSession(callId: string, values: Partial<typeof callSessions.$inferInsert>) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const existing = memoryStore.callSessions.get(callId);
    if (existing) {
      memoryStore.callSessions.set(callId, { ...existing, ...values, updatedAt: new Date() } as CallSession);
    }
    return;
  }
  await dbInstance.update(callSessions).set(values).where(eq(callSessions.callId, callId));
}

export async function getApprovedReviews(limit = 24, offset = 0) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return memoryStore.reviews
      .filter(r => r.status === "approved")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  try {
    return await dbInstance.select().from(reviews)
      .where(eq(reviews.status, "approved"))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  } catch {
    dbMocked = true;
    return [];
  }
}

export async function getApprovedReviewCount() {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return memoryStore.reviews.filter(r => r.status === "approved").length;
  }
  try {
    const [result] = await dbInstance.select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.status, "approved"));
    return Number(result?.count ?? 0);
  } catch {
    dbMocked = true;
    return 0;
  }
}

export async function createReview(review: InsertReview) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const id = memoryStore.nextId++;
    const now = new Date();
    memoryStore.reviews.push({
      id,
      ...review,
      vehicle: review.vehicle ?? null,
      status: review.status ?? "pending",
      moderatedAt: null,
      moderatedBy: null,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  }
  const [result] = await dbInstance.insert(reviews).values(review);
  return { id: result.insertId };
}

export async function importPendingReviews(entries: InsertReview[]) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    if (!entries.length) return { inserted: 0, skipped: 0 } as const;
    const existingReferences = new Set(memoryStore.reviews.map(r => r.publicReference).filter(Boolean));
    const pendingEntries = entries.filter(entry => !entry.publicReference || !existingReferences.has(entry.publicReference));
    for (const entry of pendingEntries) {
      await createReview(entry);
    }
    return { inserted: pendingEntries.length, skipped: entries.length - pendingEntries.length } as const;
  }
  if (!entries.length) return { inserted: 0, skipped: 0 } as const;

  const references = entries.map(entry => entry.publicReference).filter((value): value is string => Boolean(value));
  const existing = references.length
    ? await dbInstance.select({ publicReference: reviews.publicReference }).from(reviews).where(inArray(reviews.publicReference, references))
    : [];
  const existingReferences = new Set(existing.map(row => row.publicReference));
  const pendingEntries = entries.filter(entry => !entry.publicReference || !existingReferences.has(entry.publicReference));

  if (pendingEntries.length) await dbInstance.insert(reviews).values(pendingEntries);
  return { inserted: pendingEntries.length, skipped: entries.length - pendingEntries.length } as const;
}

export async function getReviewStatusByReference(publicReference: string) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const match = memoryStore.reviews.find(r => r.publicReference === publicReference);
    return match ? { publicReference: match.publicReference, status: match.status, createdAt: match.createdAt } : undefined;
  }
  const [result] = await dbInstance.select({
    publicReference: reviews.publicReference,
    status: reviews.status,
    createdAt: reviews.createdAt,
  }).from(reviews).where(eq(reviews.publicReference, publicReference)).limit(1);
  return result;
}

export async function hasDuplicateReview(name: string, review: string) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return memoryStore.reviews.some(r => r.name === name && r.review === review);
  }
  const result = await dbInstance.select({ id: reviews.id }).from(reviews)
    .where(and(eq(reviews.name, name), eq(reviews.review, review)))
    .limit(1);
  return result.length > 0;
}

export async function getPendingReviews() {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return memoryStore.reviews
      .filter(r => r.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return dbInstance.select().from(reviews)
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt));
}

export async function updateReviewStatus(id: number, status: "approved" | "rejected", moderatedBy: number) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const item = memoryStore.reviews.find(r => r.id === id);
    if (item) {
      item.status = status;
      item.moderatedAt = new Date();
      item.moderatedBy = moderatedBy;
      item.updatedAt = new Date();
    }
    return { success: true } as const;
  }
  await dbInstance.update(reviews).set({ status, moderatedAt: new Date(), moderatedBy }).where(eq(reviews.id, id));
  return { success: true } as const;
}

export async function createAdminMedia(media: InsertAdminMedia) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const id = memoryStore.nextId++;
    const now = new Date();
    memoryStore.adminMedia.push({
      id,
      kind: media.kind,
      language: media.language ?? "shared",
      pairKey: media.pairKey ?? null,
      title: media.title,
      storageKey: media.storageKey,
      url: media.url,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      status: media.status ?? "draft",
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  }
  const [result] = await dbInstance.insert(adminMedia).values(media);
  return { id: result.insertId };
}

export async function createAdminMediaPair(media: InsertAdminMedia[]) {
  if (!media.length) throw new Error("At least one media asset is required");
  const dbInstance = await getDb();
  if (!dbInstance) {
    for (const item of media) {
      await createAdminMedia(item);
    }
    return { count: media.length };
  }
  await dbInstance.insert(adminMedia).values(media);
  return { count: media.length };
}

export async function getAdminMediaById(id: number) {
  const dbInstance = await getDb();
  if (!dbInstance) return memoryStore.adminMedia.find(m => m.id === id);
  const [row] = await dbInstance.select().from(adminMedia).where(eq(adminMedia.id, id)).limit(1);
  return row;
}

export async function updateAdminMedia(id: number, values: Partial<InsertAdminMedia>) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    const item = memoryStore.adminMedia.find(m => m.id === id);
    if (item) {
      Object.assign(item, values, { updatedAt: new Date() });
    }
    return { success: true } as const;
  }
  await dbInstance.update(adminMedia).set(values).where(eq(adminMedia.id, id));
  return { success: true } as const;
}

export async function getAdminMedia(limit = 100) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return [...memoryStore.adminMedia]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  try {
    return await dbInstance.select().from(adminMedia).orderBy(desc(adminMedia.createdAt)).limit(limit);
  } catch {
    dbMocked = true;
    return [] as AdminMedia[];
  }
}

export async function getPublishedAdminMedia(limit = 100) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return memoryStore.adminMedia
      .filter(m => m.status === "published")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  try {
    return await dbInstance.select().from(adminMedia).where(eq(adminMedia.status, "published")).orderBy(desc(adminMedia.createdAt)).limit(limit);
  } catch {
    dbMocked = true;
    return [] as AdminMedia[];
  }
}

export async function updateAdminMediaStatus(id: number, status: "draft" | "published") {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return updateAdminMedia(id, { status });
  }
  await dbInstance.update(adminMedia).set({ status }).where(eq(adminMedia.id, id));
  return { success: true } as const;
}
