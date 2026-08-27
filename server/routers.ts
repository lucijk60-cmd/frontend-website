import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createReview, getApprovedReviewCount, getApprovedReviews, getPendingReviews, hasDuplicateReview, updateReviewStatus } from "./db";

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
