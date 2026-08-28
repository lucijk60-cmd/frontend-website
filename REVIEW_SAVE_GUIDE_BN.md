# PPFStudio: Visitor Review Database-এ Save না হওয়ার সমস্যা ও সমাধান

## প্রথমে সমস্যাটি আলাদা করে বুঝতে হবে

Review save না হওয়ার অভিযোগে সাধারণত দুটি আলাদা অবস্থা একসঙ্গে মিশে যায়। প্রথমটি হলো database insert সত্যিই ব্যর্থ হওয়া। দ্বিতীয়টি হলো review database-এ save হলেও `pending` status-এ থাকার কারণে public review count বা list-এ না দেখা যাওয়া। PPFStudio-এর বর্তমান moderation policy অনুযায়ী visitor submission প্রথমে `pending` হয় এবং admin approve করার পরে public list-এ আসে।

বর্তমান database যাচাইয়ে একটি `pending` review এবং পাঁচটি `approved` review পাওয়া গিয়েছিল। অর্থাৎ অন্তত একটি visitor submission database-এ save হয়েছিল; public list-এ না দেখানোর কারণ ছিল status filter, database failure নয়।

## ১. Schema সঠিক রাখতে হবে

Review table-এ প্রয়োজনীয় field থাকতে হবে। `publicReference` field visitor-কে status tracking code দেওয়ার জন্য unique রাখা হয়েছে।

```ts
// drizzle/schema.ts
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  publicReference: varchar("publicReference", { length: 32 }).unique(),
  name: varchar("name", { length: 120 }).notNull(),
  vehicle: varchar("vehicle", { length: 120 }),
  rating: int("rating").notNull(),
  review: text("review").notNull(),
  reviewAr: text("reviewAr"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  moderatedAt: timestamp("moderatedAt"),
  moderatedBy: int("moderatedBy"),
});
```

Schema পরিবর্তনের পরে migration generate এবং database-এ apply করতে হবে। Full-stack project-এ migration workflow হলো:

```bash
pnpm drizzle-kit generate
```

Generated SQL অবশ্যই review করে তারপর database migration tool দিয়ে apply করতে হবে। `DROP TABLE` বা existing data মুছে ফেলার মতো destructive SQL ব্যবহার করা যাবে না।

## ২. Database connection silently fail করা যাবে না

`getDb()` database connection তৈরি করে। Database unavailable হলে visitor-কে success দেখানো যাবে না; error throw করতে হবে। Insert helper-এ এই contract বজায় রাখতে হবে।

```ts
// server/db.ts
export async function createReview(review: InsertReview) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database is not available");
  }

  const [result] = await db.insert(reviews).values(review);
  return { id: result.insertId };
}
```

এখানে `db` না থাকলে `throw` হওয়ায় frontend-এর `onError` চালু হবে। বিপরীতে error গোপন করে `{ success: true }` ফেরত দিলে visitor ভুলভাবে মনে করবেন review save হয়েছে।

## ৩. Submit procedure-এ validation, duplicate check ও insert থাকতে হবে

tRPC procedure-এর দায়িত্ব হলো input validate করা, duplicate submission আটকানো, unique reference তৈরি করা এবং `pending` review insert করা।

```ts
// server/routers.ts
submit: publicProcedure
  .input(z.object({
    name: z.string().trim().min(2).max(120),
    vehicle: z.string().trim().max(120).optional(),
    rating: z.number().int().min(1).max(5),
    review: z.string().trim().min(20).max(1000),
  }))
  .mutation(async ({ input }) => {
    if (await hasDuplicateReview(input.name, input.review)) {
      throw new Error("A matching review has already been submitted.");
    }

    const publicReference = `PPF-${randomUUID()
      .replaceAll("-", "")
      .slice(0, 12)
      .toUpperCase()}`;

    const saved = await createReview({
      ...input,
      publicReference,
      status: "pending",
    });

    return {
      ...saved,
      publicReference,
      status: "pending" as const,
    };
  }),
```

এই code-এ database insert সফল না হলে mutation success response পাঠাবে না। ফলে frontend success message দেখাবে না এবং visitor বুঝতে পারবেন যে save হয়নি।

## ৪. Public list-এ কেন নতুন review দেখা যায় না

Public list intentionalভাবে শুধু approved review query করে। এটি security বা data-loss bug নয়; authenticity moderation-এর নিয়ম।

```ts
// server/db.ts
export async function getApprovedReviews(limit = 24, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);
}
```

Admin review approve করলে row-এর status পরিবর্তিত হয়:

```ts
export async function updateReviewStatus(
  id: number,
  status: "approved" | "rejected",
  moderatedBy: number,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db
    .update(reviews)
    .set({
      status,
      moderatedAt: new Date(),
      moderatedBy,
    })
    .where(eq(reviews.id, id));

  return { success: true } as const;
}
```

## ৫. Frontend mutation-এ cache refresh করতে হবে

Database insert সফল হওয়ার পরে React Query/tRPC cache invalidate না করলে পুরোনো count ও list কিছু সময় দেখা যেতে পারে। তাই success callback-এ public এবং admin pending query refresh করা উচিত।

```tsx
// client/src/pages/Home.tsx
const submitReview = trpc.reviews.submit.useMutation({
  onSuccess: async (result) => {
    await Promise.all([
      trpcUtils.reviews.list.invalidate(),
      trpcUtils.reviews.pending.invalidate(),
    ]);

    setReviewName("");
    setReviewVehicle("");
    setReviewRating(5);
    setReviewText("");
    setReviewFormOpen(false);
    setReviewSubmittedNotice(true);
    setReviewReference(result.publicReference);
    setTrackingInput(result.publicReference);
    setTrackingReference(result.publicReference);

    toast.success(
      "Saved successfully. Your review is awaiting approval before publication.",
    );
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

এখানে গুরুত্বপূর্ণ বিষয় হলো `onSuccess` শুধু insert সত্যিই সফল হলে চালু হবে। `onError`-এ validation error, duplicate review অথবা database connection error visitor-কে দেখানো উচিত।

## ৬. Visitor-এর status/reference lookup

Submit response-এ পাওয়া `PPF-XXXXXXXXXXXX` code database-এ lookup করা যায়। Sensitive review text, name বা vehicle public endpoint থেকে ফেরত দেওয়া উচিত নয়।

```ts
// server/db.ts
export async function getReviewStatusByReference(publicReference: string) {
  const db = await getDb();
  if (!db) return undefined;

  const [result] = await db
    .select({
      publicReference: reviews.publicReference,
      status: reviews.status,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.publicReference, publicReference))
    .limit(1);

  return result;
}
```

তারপর tRPC query-তে format validation দিতে হবে:

```ts
statusByReference: publicProcedure
  .input(
    z.object({
      publicReference: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^PPF-[A-Z0-9]{12}$/),
    }),
  )
  .query(async ({ input }) => {
    return (await getReviewStatusByReference(input.publicReference)) ?? null;
  }),
```

## ৭. Database-এ review সত্যিই save হয়েছে কিনা কীভাবে পরীক্ষা করবেন

Admin বা database console থেকে status count দেখা যায়:

```sql
SELECT status, COUNT(*) AS total
FROM reviews
GROUP BY status
ORDER BY status;
```

সর্বশেষ review records দেখতে:

```sql
SELECT
  id,
  publicReference,
  name,
  rating,
  status,
  createdAt,
  moderatedAt
FROM reviews
ORDER BY id DESC
LIMIT 20;
```

ফলাফল বোঝার নিয়মটি হলো:

| Database result | অর্থ | পরবর্তী কাজ |
|---|---|---|
| নতুন row নেই | Insert বা database connection ব্যর্থ | server log, validation এবং migration পরীক্ষা করতে হবে |
| নতুন row আছে, status `pending` | Review save হয়েছে, moderation অপেক্ষায় | Admin panel থেকে approve করুন |
| নতুন row আছে, status `approved` | Review public হওয়া উচিত | public query cache ও status filter পরীক্ষা করুন |
| `publicReference` null | পুরোনো row বা migration/backfill প্রয়োজন | নতুন submission-এ reference তৈরি হচ্ছে কিনা পরীক্ষা করুন |

## ৮. সবচেয়ে সাধারণ ভুলগুলো

প্রথম ভুল হলো `submit` সফল হওয়ার পরে `status: "approved"` ধরে নেওয়া। দ্বিতীয় ভুল হলো frontend-এ mutation error handle না করে সবসময় success toast দেখানো। তৃতীয় ভুল হলো database schema পরিবর্তনের পরে migration apply না করা। চতুর্থ ভুল হলো insert সফল হলেও public query-তে `status = approved` filter-এর কারণে pending row-কে missing ধরে নেওয়া। পঞ্চম ভুল হলো query cache invalidate না করা।

PPFStudio-এর বর্তমান implementation-এ মূল behavior হলো: **visitor submission database-এ `pending` হিসেবে save হয়, admin approve করার আগে public review count/list-এ দেখা যায় না**। এই design genuine review policy বজায় রাখে এবং fake বা unmoderated content public হওয়ার ঝুঁকি কমায়।

## Owner-side verification checklist

1. Review form-এ valid name, ১–৫ rating এবং কমপক্ষে ২০ characters-এর review দিন।
2. Success message-এ reference code কপি করুন।
3. Reference tracker-এ code দিয়ে `Pending approval` status দেখুন।
4. Admin panel-এ pending review খুলে approve করুন।
5. Public review count/list refresh করে `Approved and published` status এবং public review appearance যাচাই করুন।

Private admin passwords share না করে owner নিজে এই smoke test করবেন। Automated tests database query filtering, reference format validation, bilingual feedback এবং public pending exclusion যাচাই করতে পারে; credentialed real-browser submission test owner-side করা নিরাপদ।
