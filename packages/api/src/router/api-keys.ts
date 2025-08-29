import { ApiKeys, ApiKeyUsage, CreateApiKeySchema } from '@untrace/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const apiKeysRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const apiKeys = await ctx.db.query.ApiKeys.findMany({
      orderBy: [desc(ApiKeys.updatedAt)],
      where: eq(ApiKeys.orgId, ctx.auth.orgId),
    });

    return apiKeys;
  }),

  allWithLastUsage: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    // Get all API keys
    const apiKeys = await ctx.db.query.ApiKeys.findMany({
      orderBy: [desc(ApiKeys.updatedAt)],
      where: eq(ApiKeys.orgId, ctx.auth.orgId),
    });

    // For each API key, get the most recent usage
    const apiKeysWithLastUsage = await Promise.all(
      apiKeys.map(async (apiKey) => {
        const lastUsage = await ctx.db.query.ApiKeyUsage.findFirst({
          orderBy: [desc(ApiKeyUsage.createdAt)],
          where: eq(ApiKeyUsage.apiKeyId, apiKey.id),
        });

        return {
          ...apiKey,
          lastUsage,
        };
      }),
    );

    return apiKeysWithLastUsage;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const apiKey = await ctx.db.query.ApiKeys.findFirst({
        where: and(eq(ApiKeys.id, input.id), eq(ApiKeys.orgId, ctx.auth.orgId)),
      });

      if (!apiKey) return null;

      return apiKey;
    }),

  create: protectedProcedure
    .input(CreateApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      try {
        const [apiKey] = await ctx.db
          .insert(ApiKeys)
          .values({
            ...input,
            orgId: ctx.auth.orgId,
            userId: ctx.auth.userId,
          })
          .returning();

        return apiKey;
      } catch (error) {
        console.error(error);
        throw new Error('Failed to create API key');
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const apiKey = await ctx.db
        .delete(ApiKeys)
        .where(and(eq(ApiKeys.id, input.id), eq(ApiKeys.orgId, ctx.auth.orgId)))
        .returning();

      return apiKey;
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // First get the current state
      const currentApiKey = await ctx.db.query.ApiKeys.findFirst({
        where: and(eq(ApiKeys.id, input.id), eq(ApiKeys.orgId, ctx.auth.orgId)),
      });

      if (!currentApiKey) throw new Error('API Key not found');

      const [apiKey] = await ctx.db
        .update(ApiKeys)
        .set({
          isActive: !currentApiKey.isActive,
        })
        .where(and(eq(ApiKeys.id, input.id), eq(ApiKeys.orgId, ctx.auth.orgId)))
        .returning();

      return apiKey;
    }),

  update: protectedProcedure
    .input(
      z.object({
        expiresAt: z.date().nullable().optional(),
        id: z.string(),
        isActive: z.boolean().optional(),
        name: z.string().optional(),
        permissions: z
          .object({
            admin: z.boolean().optional(),
            delete: z.boolean().optional(),
            read: z.boolean().optional(),
            webhookIds: z.array(z.string()).optional(),
            write: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const { id, ...updateData } = input;

      const [apiKey] = await ctx.db
        .update(ApiKeys)
        .set(updateData)
        .where(and(eq(ApiKeys.id, id), eq(ApiKeys.orgId, ctx.auth.orgId)))
        .returning();

      return apiKey;
    }),

  updateLastUsed: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [apiKey] = await ctx.db
        .update(ApiKeys)
        .set({
          lastUsedAt: new Date(),
        })
        .where(and(eq(ApiKeys.id, input.id), eq(ApiKeys.orgId, ctx.auth.orgId)))
        .returning();

      return apiKey;
    }),
});
