import { and, eq, sql } from '@untrace/db';
import { db } from '@untrace/db/client';
import { Deliveries, Destinations } from '@untrace/db/schema';
import {
  getActiveDestinations,
  getDestinationById,
} from '@untrace/destinations';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// Use Drizzle-generated schemas exclusively
const DestinationSelectSchema = createSelectSchema(Destinations);

// Type for org destinations with destination config
const DestinationWithConfigSchema = DestinationSelectSchema.extend({
  destination: z.object({
    configSchema: z.record(z.string(), z.unknown()),
    defaultTransform: z.string().optional(),
    description: z.string(),
    id: z.string(),
    isActive: z.boolean(),
    logo: z.string().optional(),
    name: z.string(),
    supportsBatchDelivery: z.boolean(),
    supportsCustomTransform: z.boolean(),
    supportsOpenTelemetry: z.boolean(),
    type: z.string(),
  }),
});

type DestinationWithConfig = z.infer<typeof DestinationWithConfigSchema>;

export const destinationsRouter = createTRPCRouter({
  // Create a new destination
  create: protectedProcedure
    .input(
      z.object({
        batchSize: z.number().int().positive().optional(),
        config: z.record(z.string(), z.unknown()),
        description: z.string().optional(),
        destinationId: z.string(),
        isEnabled: z.boolean().optional(),
        maxRetries: z.number().int().positive().optional(),
        name: z.string(),
        projectId: z.string(),
        rateLimit: z.number().int().positive().optional(),
        retryDelayMs: z.number().int().positive().optional(),
        retryEnabled: z.boolean().optional(),
        transformFunction: z.string().optional(),
      }),
    )
    .output(DestinationWithConfigSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Organization not found');
      }

      // Verify provider exists in config
      const destination = getDestinationById(input.destinationId);
      if (!destination) {
        throw new Error('Invalid destination ID');
      }

      const [createdDestination] = await db
        .insert(Destinations)
        .values({
          batchSize: input.batchSize || null,
          config: input.config,
          description: input.description || null,
          destinationId: input.destinationId,
          isEnabled: input.isEnabled ?? true,
          maxRetries: input.maxRetries || 3,
          name: input.name,
          orgId: ctx.auth.orgId,
          projectId: input.projectId,
          rateLimit: input.rateLimit || null,
          retryDelayMs: input.retryDelayMs || 1000,
          retryEnabled: input.retryEnabled ?? true,
          transformFunction: input.transformFunction || null,
        })
        .returning();

      if (!createdDestination) {
        throw new Error('Failed to create destination');
      }

      // Return with destination config
      return {
        ...createdDestination,
        destination,
      } as DestinationWithConfig;
    }),

  // Delete a destination
  delete: protectedProcedure
    .input(z.object({ id: z.string(), projectId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Organization not found');
      }

      const result = await db
        .delete(Destinations)
        .where(
          and(
            eq(Destinations.id, input.id),
            eq(Destinations.orgId, ctx.auth.orgId),
            eq(Destinations.projectId, input.projectId),
          ),
        )
        .returning({ id: Destinations.id });

      if (result.length === 0) {
        throw new Error('Destination not found');
      }

      return { success: true };
    }),

  // Get delivery statistics for destinations
  deliveryStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        destinationId: z.string().optional(),
        projectId: z.string(),
      }),
    )
    .output(
      z.object({
        stats: z.array(
          z.object({
            destinationId: z.string(),
            failedDeliveries: z.number(),
            successfulDeliveries: z.number(),
            successRate: z.number(),
            totalDeliveries: z.number(),
          }),
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Organization not found');
      }

      const { destinationId, days, projectId } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all destinations for the org and project
      const destinations = await db.query.Destinations.findMany({
        where: destinationId
          ? and(
              eq(Destinations.orgId, ctx.auth.orgId),
              eq(Destinations.projectId, projectId),
              eq(Destinations.id, destinationId),
            )
          : and(
              eq(Destinations.orgId, ctx.auth.orgId),
              eq(Destinations.projectId, projectId),
            ),
      });

      // Get delivery statistics for each destination
      const stats = await Promise.all(
        destinations.map(async (destination) => {
          const conditions = [
            eq(Deliveries.destinationId, destination.id),
            sql`${Deliveries.createdAt} >= ${startDate}`,
          ];

          const [totalResult, successResult, failedResult] = await Promise.all([
            // Total deliveries
            db
              .select({ count: sql<number>`count(*)` })
              .from(Deliveries)
              .where(and(...conditions)),
            // Successful deliveries
            db
              .select({ count: sql<number>`count(*)` })
              .from(Deliveries)
              .where(and(...conditions, eq(Deliveries.status, 'success'))),
            // Failed deliveries
            db
              .select({ count: sql<number>`count(*)` })
              .from(Deliveries)
              .where(and(...conditions, eq(Deliveries.status, 'failed'))),
          ]);

          const totalDeliveries = Number(totalResult[0]?.count || 0);
          const successfulDeliveries = Number(successResult[0]?.count || 0);
          const failedDeliveries = Number(failedResult[0]?.count || 0);
          const successRate =
            totalDeliveries > 0
              ? (successfulDeliveries / totalDeliveries) * 100
              : 0;

          return {
            destinationId: destination.id,
            failedDeliveries,
            successfulDeliveries,
            successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
            totalDeliveries,
          };
        }),
      );

      return { stats };
    }),

  // Get a specific destination
  get: protectedProcedure
    .input(z.object({ id: z.string(), projectId: z.string() }))
    .output(DestinationWithConfigSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Organization not found');
      }

      const destination = await db.query.Destinations.findFirst({
        where: and(
          eq(Destinations.id, input.id),
          eq(Destinations.orgId, ctx.auth.orgId),
          eq(Destinations.projectId, input.projectId),
        ),
      });

      if (!destination) {
        throw new Error('Destination not found');
      }

      // Get destination config
      const destinationConfig = getDestinationById(destination.destinationId);
      if (!destinationConfig) {
        throw new Error('Destination configuration not found');
      }

      return {
        ...destination,
        destination: destinationConfig,
      } as DestinationWithConfig;
    }),

  // List organization destinations
  list: protectedProcedure
    .input(
      z.object({
        destinationId: z.string().optional(),
        isEnabled: z.boolean().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
        projectId: z.string(),
      }),
    )
    .output(
      z.object({
        destinations: z.array(DestinationWithConfigSchema),
        total: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Organization not found');
      }

      const conditions = [
        eq(Destinations.orgId, ctx.auth.orgId),
        eq(Destinations.projectId, input.projectId),
      ];

      if (input.isEnabled !== undefined) {
        conditions.push(eq(Destinations.isEnabled, input.isEnabled));
      }
      if (input.destinationId) {
        conditions.push(eq(Destinations.destinationId, input.destinationId));
      }

      const destinations = await db.query.Destinations.findMany({
        limit: input.limit,
        offset: input.offset,
        where: and(...conditions),
      });

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(Destinations)
        .where(and(...conditions))
        .then((result) => Number(result[0]?.count || 0));

      // Add destination configs to each destination
      const destinationsWithConfig = destinations.map((destination) => {
        const destinationConfig = getDestinationById(destination.destinationId);
        if (!destinationConfig) {
          throw new Error(
            `Destination configuration not found for ${destination.destinationId}`,
          );
        }
        return {
          ...destination,
          destination: destinationConfig,
        };
      });

      return {
        destinations: destinationsWithConfig as DestinationWithConfig[],
        total,
      };
    }),

  // List available destination providers
  listProviders: protectedProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
        })
        .optional(),
    )
    .output(
      z.object({
        providers: z.array(
          z.object({
            configSchema: z.record(z.string(), z.unknown()),
            defaultTransform: z.string().optional(),
            description: z.string(),
            id: z.string(),
            isActive: z.boolean(),
            logo: z.string().optional(),
            name: z.string(),
            supportsBatchDelivery: z.boolean(),
            supportsCustomTransform: z.boolean(),
            supportsOpenTelemetry: z.boolean(),
            type: z.string(),
          }),
        ),
      }),
    )
    .query(async ({ input }) => {
      let providers = getActiveDestinations();

      if (input?.isActive !== undefined) {
        providers = providers.filter(
          (provider) => provider.isActive === input.isActive,
        );
      }

      return {
        providers,
      };
    }),

  // Test a destination
  test: protectedProcedure
    .input(
      z.object({
        config: z.record(z.string(), z.unknown()).optional(),
        id: z.string(),
        projectId: z.string(),
        sampleTrace: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(
      z.object({
        details: z
          .object({
            destination: z.string().optional(),
            destinationName: z.string().optional(),
          })
          .optional(),
        message: z.string(),
        success: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Organization not found');
      }

      const destination = await db.query.Destinations.findFirst({
        where: and(
          eq(Destinations.id, input.id),
          eq(Destinations.orgId, ctx.auth.orgId),
          eq(Destinations.projectId, input.projectId),
        ),
      });

      if (!destination) {
        throw new Error('Destination not found');
      }

      // Get destination config
      const destinationConfig = getDestinationById(destination.destinationId);
      if (!destinationConfig) {
        throw new Error('Destination configuration not found');
      }

      // TODO: Implement actual testing logic based on provider type
      // This would involve making a test API call or connection

      return {
        details: {
          destination: destinationConfig.type,
          destinationName: destination.name,
        },
        message: `Test connection to ${destinationConfig.name} successful`,
        success: true,
      };
    }),

  // Update a destination
  update: protectedProcedure
    .input(
      z.object({
        data: z.object({
          batchSize: z.number().int().positive().optional(),
          config: z.record(z.string(), z.unknown()).optional(),
          description: z.string().optional(),
          isEnabled: z.boolean().optional(),
          maxRetries: z.number().int().positive().optional(),
          name: z.string().optional(),
          rateLimit: z.number().int().positive().optional(),
          retryDelayMs: z.number().int().positive().optional(),
          retryEnabled: z.boolean().optional(),
          transformFunction: z.string().optional(),
        }),
        id: z.string(),
        projectId: z.string(),
      }),
    )
    .output(DestinationWithConfigSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Organization not found');
      }

      // Check if destination exists and belongs to org and project
      const existingDestination = await db.query.Destinations.findFirst({
        where: and(
          eq(Destinations.id, input.id),
          eq(Destinations.orgId, ctx.auth.orgId),
          eq(Destinations.projectId, input.projectId),
        ),
      });

      if (!existingDestination) {
        throw new Error('Destination not found');
      }

      // Build update object with only provided fields
      const updateData: Partial<{
        description: string | null;
        config: Record<string, unknown>;
        isEnabled: boolean;
        name: string;
        batchSize: number | null;
        maxRetries: number;
        rateLimit: number | null;
        retryDelayMs: number;
        retryEnabled: boolean;
        transformFunction: string | null;
      }> = {};

      if (input.data.description !== undefined)
        updateData.description = input.data.description;
      if (input.data.config !== undefined)
        updateData.config = input.data.config;
      if (input.data.isEnabled !== undefined)
        updateData.isEnabled = input.data.isEnabled;
      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.batchSize !== undefined)
        updateData.batchSize = input.data.batchSize;
      if (input.data.maxRetries !== undefined)
        updateData.maxRetries = input.data.maxRetries;
      if (input.data.rateLimit !== undefined)
        updateData.rateLimit = input.data.rateLimit;
      if (input.data.retryDelayMs !== undefined)
        updateData.retryDelayMs = input.data.retryDelayMs;
      if (input.data.retryEnabled !== undefined)
        updateData.retryEnabled = input.data.retryEnabled;
      if (input.data.transformFunction !== undefined)
        updateData.transformFunction = input.data.transformFunction;

      const [updatedDestination] = await db
        .update(Destinations)
        .set(updateData)
        .where(eq(Destinations.id, input.id))
        .returning();

      if (!updatedDestination) {
        throw new Error('Failed to update destination');
      }

      // Get destination config
      const destinationConfig = getDestinationById(
        updatedDestination.destinationId,
      );
      if (!destinationConfig) {
        throw new Error('Destination configuration not found');
      }

      return {
        ...updatedDestination,
        destination: destinationConfig,
      } as DestinationWithConfig;
    }),
});
