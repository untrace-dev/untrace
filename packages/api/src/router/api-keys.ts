import { ApiKeys, ApiKeyUsage, CreateApiKeySchema } from '@untrace/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const apiKeysRouter = createTRPCRouter({
  all: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const apiKeys = await ctx.db.query.ApiKeys.findMany({
        orderBy: [desc(ApiKeys.updatedAt)],
        where: and(
          eq(ApiKeys.orgId, ctx.auth.orgId),
          eq(ApiKeys.projectId, input.projectId),
        ),
      });

      return apiKeys;
    }),

  allWithLastUsage: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // Get all API keys for the specific project
      const apiKeys = await ctx.db.query.ApiKeys.findMany({
        orderBy: [desc(ApiKeys.updatedAt)],
        where: and(
          eq(ApiKeys.orgId, ctx.auth.orgId),
          eq(ApiKeys.projectId, input.projectId),
        ),
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
    .input(z.object({ id: z.string(), projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const apiKey = await ctx.db.query.ApiKeys.findFirst({
        where: and(
          eq(ApiKeys.id, input.id),
          eq(ApiKeys.orgId, ctx.auth.orgId),
          eq(ApiKeys.projectId, input.projectId),
        ),
      });

      if (!apiKey) return null;

      return apiKey;
    }),

  create: protectedProcedure
    .input(CreateApiKeySchema.extend({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      try {
        const [apiKey] = await ctx.db
          .insert(ApiKeys)
          .values({
            ...input,
            orgId: ctx.auth.orgId,
            projectId: input.projectId,
            userId: ctx.auth.userId,
          })
          .returning();

        return apiKey;
      } catch (error) {
        console.error(error);
        throw new Error('Failed to create API key');
      }
    }),

  default: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const apiKey = await ctx.db.query.ApiKeys.findFirst({
        orderBy: [desc(ApiKeys.createdAt)],
        where: and(
          eq(ApiKeys.orgId, ctx.auth.orgId),
          eq(ApiKeys.projectId, input.projectId),
        ),
      });

      if (!apiKey) return null;

      return apiKey;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const apiKey = await ctx.db
        .delete(ApiKeys)
        .where(
          and(
            eq(ApiKeys.id, input.id),
            eq(ApiKeys.orgId, ctx.auth.orgId),
            eq(ApiKeys.projectId, input.projectId),
          ),
        )
        .returning();

      return apiKey;
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // First get the current state
      const currentApiKey = await ctx.db.query.ApiKeys.findFirst({
        where: and(
          eq(ApiKeys.id, input.id),
          eq(ApiKeys.orgId, ctx.auth.orgId),
          eq(ApiKeys.projectId, input.projectId),
        ),
      });

      if (!currentApiKey) throw new Error('API Key not found');

      const [apiKey] = await ctx.db
        .update(ApiKeys)
        .set({
          isActive: !currentApiKey.isActive,
        })
        .where(
          and(
            eq(ApiKeys.id, input.id),
            eq(ApiKeys.orgId, ctx.auth.orgId),
            eq(ApiKeys.projectId, input.projectId),
          ),
        )
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
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const { id, projectId, ...updateData } = input;

      const [apiKey] = await ctx.db
        .update(ApiKeys)
        .set(updateData)
        .where(
          and(
            eq(ApiKeys.id, id),
            eq(ApiKeys.orgId, ctx.auth.orgId),
            eq(ApiKeys.projectId, projectId),
          ),
        )
        .returning();

      return apiKey;
    }),

  updateLastUsed: protectedProcedure
    .input(z.object({ id: z.string(), projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const [apiKey] = await ctx.db
        .update(ApiKeys)
        .set({
          lastUsedAt: new Date(),
        })
        .where(
          and(
            eq(ApiKeys.id, input.id),
            eq(ApiKeys.orgId, ctx.auth.orgId),
            eq(ApiKeys.projectId, input.projectId),
          ),
        )
        .returning();

      return apiKey;
    }),
});
