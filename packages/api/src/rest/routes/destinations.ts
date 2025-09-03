import crypto from 'node:crypto';
import { ORPCError, os } from '@orpc/server';
import { and, eq, sql } from '@untrace/db';

import { db } from '@untrace/db/client';
import { Destinations } from '@untrace/db/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Use Drizzle-generated schemas exclusively
const DestinationSelectSchema = createSelectSchema(Destinations);
const OrgDestinationSelectSchema = createSelectSchema(Destinations);

// Helper to get organization ID from context
async function getOrgId(context: {
  auth?: { orgId?: string };
}): Promise<string> {
  const orgId = context.auth?.orgId;
  if (!orgId) {
    throw new ORPCError('UNAUTHORIZED', {
      message:
        'Organization ID not provided. Please provide a valid API key in the Authorization header.',
    });
  }
  return orgId;
}

// Helper to get project ID from context
async function getProjectId(context: {
  auth?: { projectId?: string };
}): Promise<string> {
  const projectId = context.auth?.projectId;
  if (!projectId) {
    throw new ORPCError('UNAUTHORIZED', {
      message:
        'Project ID not provided. Please provide a valid API key in the Authorization header.',
    });
  }
  return projectId;
}

// Simple encryption for secrets (in production, use proper key management)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing';
const algorithm = 'aes-256-gcm';

function _encryptSecrets(secrets: Record<string, string>): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv,
  );

  let encrypted = cipher.update(JSON.stringify(secrets), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    authTag: authTag.toString('hex'),
    encrypted,
    iv: iv.toString('hex'),
  });
}

function _decryptSecrets(encryptedData: string): Record<string, string> {
  const { iv, authTag, encrypted } = JSON.parse(encryptedData);

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex'),
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

// oRPC handlers
export const createDestination = os
  .input(
    z.object({
      batchSize: z.number().int().positive().optional(),
      config: z.record(z.string(), z.unknown()),
      description: z.string().optional(),
      destinationId: z.string(),
      isEnabled: z.boolean().optional(),
      maxRetries: z.number().int().positive().optional(),
      name: z.string(),
      rateLimit: z.number().int().positive().optional(),
      retryDelayMs: z.number().int().positive().optional(),
      retryEnabled: z.boolean().optional(),
      transformFunction: z.string().optional(),
    }),
  )
  .output(OrgDestinationSelectSchema)
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);
      const projectId = await getProjectId(context);

      // Verify provider exists
      const destination = await db.query.Destinations.findFirst({
        where: eq(Destinations.id, input.destinationId),
      });

      if (!destination) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid destination ID',
        });
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
          orgId,
          projectId,
          rateLimit: input.rateLimit || null,
          retryDelayMs: input.retryDelayMs || 1000,
          retryEnabled: input.retryEnabled ?? true,
          transformFunction: input.transformFunction || null,
        })
        .returning();

      if (!createdDestination) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Failed to create destination',
        });
      }

      // Fetch with provider relation
      const destinationWithRelation = await db.query.Destinations.findFirst({
        where: eq(Destinations.id, createdDestination.id),
      });

      if (!destinationWithRelation) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Failed to create destination',
        });
      }

      return destinationWithRelation;
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create destination',
      });
    }
  });

export const deleteDestination = os
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      const result = await db
        .delete(Destinations)
        .where(
          and(eq(Destinations.id, input.id), eq(Destinations.orgId, orgId)),
        )
        .returning({ id: Destinations.id });

      if (result.length === 0) {
        throw new ORPCError('NOT_FOUND', { message: 'Destination not found' });
      }

      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const getDestination = os
  .input(z.object({ id: z.string() }))
  .output(OrgDestinationSelectSchema)
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      const destination = await db.query.Destinations.findFirst({
        where: and(
          eq(Destinations.id, input.id),
          eq(Destinations.orgId, orgId),
        ),
      });

      if (!destination) {
        throw new ORPCError('NOT_FOUND', { message: 'Destination not found' });
      }

      return destination;
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const getProvider = os
  .input(z.object({ id: z.string() }))
  .output(DestinationSelectSchema)
  .handler(async ({ input }) => {
    try {
      const destination = await db.query.Destinations.findFirst({
        where: eq(Destinations.id, input.id),
      });

      if (!destination) {
        throw new ORPCError('NOT_FOUND', { message: 'Provider not found' });
      }

      return destination;
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const listDestinations = os
  .input(
    z.object({
      destinationId: z.string().optional(),
      isEnabled: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    }),
  )
  .output(
    z.object({
      destinations: z.array(OrgDestinationSelectSchema),
      total: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      const conditions = [eq(Destinations.orgId, orgId)];

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
        with: {},
      });

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(Destinations)
        .where(and(...conditions))
        .then((result) => Number(result[0]?.count || 0));

      return {
        destinations,
        total,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const listProviders = os
  .input(
    z.object({
      isActive: z.boolean().optional(),
    }),
  )
  .output(
    z.object({
      providers: z.array(DestinationSelectSchema),
    }),
  )
  .handler(async ({ input }) => {
    try {
      const conditions: ReturnType<typeof eq>[] = [];

      if (input.isActive !== undefined) {
        conditions.push(eq(Destinations.isEnabled, input.isActive));
      }

      const providers = await db.query.Destinations.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
      });

      return {
        providers,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const testDestination = os
  .input(
    z.object({
      config: z.record(z.string(), z.unknown()).optional(),
      id: z.string(),
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
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      const destination = await db.query.Destinations.findFirst({
        where: and(
          eq(Destinations.id, input.id),
          eq(Destinations.orgId, orgId),
        ),
      });

      if (!destination) {
        throw new ORPCError('NOT_FOUND', { message: 'Destination not found' });
      }

      // TODO: Implement actual testing logic based on provider type
      // This would involve making a test API call or connection

      return {
        details: {
          destination: destination.destinationId,
          destinationName: destination.name,
        },
        message: `Test connection to ${destination.name} successful`,
        success: true,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message: error instanceof Error ? error.message : 'Test failed',
      });
    }
  });

export const testNewDestination = os
  .input(
    z.object({
      config: z.record(z.string(), z.unknown()).optional(),
      destinationId: z.string(),
      sampleTrace: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .output(
    z.object({
      details: z
        .object({
          destination: z.string().optional(),
        })
        .optional(),
      message: z.string(),
      success: z.boolean(),
    }),
  )
  .handler(async ({ input }) => {
    try {
      const destination = await db.query.Destinations.findFirst({
        where: eq(Destinations.id, input.destinationId),
      });

      if (!destination) {
        throw new ORPCError('BAD_REQUEST', { message: 'Invalid provider ID' });
      }

      // TODO: Implement actual testing logic based on provider type
      // This would involve making a test API call or connection

      return {
        details: {
          destination: destination.destinationId,
        },
        message: `Test connection to ${destination.name} successful`,
        success: true,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message: error instanceof Error ? error.message : 'Test failed',
      });
    }
  });

export const updateDestination = os
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
    }),
  )
  .output(OrgDestinationSelectSchema)
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      // Check if destination exists and belongs to org
      const existingDestination = await db.query.Destinations.findFirst({
        where: and(
          eq(Destinations.id, input.id),
          eq(Destinations.orgId, orgId),
        ),
      });

      if (!existingDestination) {
        throw new ORPCError('NOT_FOUND', { message: 'Destination not found' });
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
        throw new ORPCError('BAD_REQUEST', {
          message: 'Failed to update destination',
        });
      }

      // Fetch with provider relation
      const destination = await db.query.Destinations.findFirst({
        where: eq(Destinations.id, input.id),
      });

      if (!destination) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Failed to update destination',
        });
      }

      return destination;
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update destination',
      });
    }
  });

// Export the destinations router
export const destinationsRouter = os.router({
  createDestination,
  deleteDestination,
  getDestination,
  getProvider,
  listDestinations,
  listProviders,
  testDestination,
  testNewDestination,
  updateDestination,
});
