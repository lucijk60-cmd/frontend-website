import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const visitorEvents = mysqlTable("visitor_events", {
  id: int("id").autoincrement().primaryKey(),
  visitorKeyHash: varchar("visitorKeyHash", { length: 64 }).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  countryCode: varchar("countryCode", { length: 8 }).notNull().default("unknown"),
  deviceClass: mysqlEnum("deviceClass", ["desktop", "mobile", "tablet", "unknown"]).default("unknown").notNull(),
  referrer: varchar("referrer", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisitorEvent = typeof visitorEvents.$inferSelect;
export type InsertVisitorEvent = typeof visitorEvents.$inferInsert;

export const callBusinesses = mysqlTable("call_businesses", {
  id: int("id").autoincrement().primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallBusiness = typeof callBusinesses.$inferSelect;
export type InsertCallBusiness = typeof callBusinesses.$inferInsert;

export const callOperators = mysqlTable("call_operators", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  operatorId: varchar("operatorId", { length: 96 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["offline", "online", "busy"]).default("offline").notNull(),
  lastSeenAt: timestamp("lastSeenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallOperator = typeof callOperators.$inferSelect;
export type InsertCallOperator = typeof callOperators.$inferInsert;

export const callSessions = mysqlTable("call_sessions", {
  id: int("id").autoincrement().primaryKey(),
  callId: varchar("callId", { length: 96 }).notNull().unique(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  operatorId: varchar("operatorId", { length: 96 }),
  callerSessionId: varchar("callerSessionId", { length: 128 }),
  customerTokenHash: varchar("customerTokenHash", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["idle", "calling", "ringing", "connecting", "connected", "reconnecting", "ended", "rejected", "busy", "failed", "permission_denied"]).default("calling").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  durationSeconds: int("durationSeconds"),
  lastSignalAt: timestamp("lastSignalAt"),
});

export type CallSession = typeof callSessions.$inferSelect;
export type InsertCallSession = typeof callSessions.$inferInsert;

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  publicReference: varchar("publicReference", { length: 32 }).unique(),
  name: varchar("name", { length: 120 }).notNull(),
  vehicle: varchar("vehicle", { length: 120 }),
  rating: int("rating").notNull(),
  review: text("review").notNull(),
  reviewAr: text("reviewAr"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  moderatedAt: timestamp("moderatedAt"),
  moderatedBy: int("moderatedBy"),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export const adminMedia = mysqlTable("admin_media", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["image", "video"]).notNull(),
  language: mysqlEnum("language", ["en", "ar", "shared"]).default("shared").notNull(),
  pairKey: varchar("pairKey", { length: 96 }),
  title: varchar("title", { length: 180 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 768 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminMedia = typeof adminMedia.$inferSelect;
export type InsertAdminMedia = typeof adminMedia.$inferInsert;
