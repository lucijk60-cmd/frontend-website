import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { AdminMedia, InsertAdminMedia, InsertReview, InsertUser, adminMedia, reviews, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getApprovedReviews(limit = 24, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getApprovedReviewCount() {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.status, "approved"));
  return Number(result?.count ?? 0);
}

export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [result] = await db.insert(reviews).values(review);
  return { id: result.insertId };
}

export async function hasDuplicateReview(name: string, review: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: reviews.id }).from(reviews)
    .where(and(eq(reviews.name, name), eq(reviews.review, review)))
    .limit(1);
  return result.length > 0;
}

export async function getPendingReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews)
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt));
}

export async function updateReviewStatus(id: number, status: "approved" | "rejected", moderatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(reviews).set({ status, moderatedAt: new Date(), moderatedBy }).where(eq(reviews.id, id));
  return { success: true } as const;
}

export async function createAdminMedia(media: InsertAdminMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [result] = await db.insert(adminMedia).values(media);
  return { id: result.insertId };
}

export async function createAdminMediaPair(media: InsertAdminMedia[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!media.length) throw new Error("At least one media asset is required");
  await db.insert(adminMedia).values(media);
  return { count: media.length };
}

export async function getAdminMediaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(adminMedia).where(eq(adminMedia.id, id)).limit(1);
  return row;
}

export async function updateAdminMedia(id: number, values: Partial<InsertAdminMedia>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(adminMedia).set(values).where(eq(adminMedia.id, id));
  return { success: true } as const;
}

export async function getAdminMedia(limit = 100) {
  const db = await getDb();
  if (!db) return [] as AdminMedia[];
  return db.select().from(adminMedia).orderBy(desc(adminMedia.createdAt)).limit(limit);
}

export async function getPublishedAdminMedia(limit = 100) {
  const db = await getDb();
  if (!db) return [] as AdminMedia[];
  return db.select().from(adminMedia).where(eq(adminMedia.status, "published")).orderBy(desc(adminMedia.createdAt)).limit(limit);
}

export async function updateAdminMediaStatus(id: number, status: "draft" | "published") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(adminMedia).set({ status }).where(eq(adminMedia.id, id));
  return { success: true } as const;
}
