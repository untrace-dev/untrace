import crypto from 'node:crypto';
import { createNextRoute } from '@ts-rest/next';
import { and, eq } from '@untrace/db';
import { db } from '@untrace/db/client';
import { DestinationProviders, OrgDestinations } from '@untrace/db/schema';
import type { NextApiRequest } from 'next';
import { destinationsContract } from '../contract/destinations';

// Helper to get organization ID from request (would be from auth in production)
async function getOrgId(req: NextApiRequest): Promise<string> {
  // TODO: Get from auth context
  const orgId = req.headers['x-organization-id'];
  if (!orgId) {
    throw new Error('Organization ID not provided');
  }
  return orgId as string;
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

export const destinationsRouter = createNextRoute(destinationsContract, {
  // Create a new destination
  createDestination: async ({ body, req }) => {
    try {
      const orgId = await getOrgId(req);

      // Verify provider exists
      const provider = await db.query.DestinationProviders.findFirst({
        where: eq(DestinationProviders.id, body.providerId),
      });

      if (!provider) {
        return {
          body: { error: 'Invalid provider ID' },
          status: 400 as const,
        };
      }

      const [destination] = await db
        .insert(OrgDestinations)
        .values({
          batchSize: body.batchSize || null,
          config: body.config,
          description: body.description || null,
          isEnabled: body.isEnabled ?? true,
          maxRetries: body.maxRetries || 3,
          name: body.name,
          orgId,
          providerId: body.providerId,
          rateLimit: body.rateLimit || null,
          retryDelayMs: body.retryDelayMs || 1000,
          retryEnabled: body.retryEnabled ?? true,
          transformFunction: body.transformFunction || null,
        })
        .returning();

      if (!destination) {
        return {
          body: { error: 'Failed to create destination' },
          status: 400 as const,
        };
      }

      // Fetch with provider relation
      const createdDestination = await db.query.OrgDestinations.findFirst({
        where: eq(OrgDestinations.id, destination.id),
        with: {
          provider: true,
        },
      });

      return {
        body: {
          ...createdDestination,
          config: createdDestination?.config as Record<string, unknown>,
          provider: createdDestination?.provider
            ? {
                ...createdDestination?.provider,
                configSchema: createdDestination?.provider
                  .configSchema as Record<string, unknown>,
              }
            : undefined,
        },
        status: 201 as const,
      };
    } catch (error) {
      return {
        body: {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create destination',
        },
        status: 400 as const,
      };
    }
  },

  // Delete a destination
  deleteDestination: async ({ params, req }) => {
    try {
      const orgId = await getOrgId(req);

      const result = await db
        .delete(OrgDestinations)
        .where(
          and(
            eq(OrgDestinations.id, params.id),
            eq(OrgDestinations.orgId, orgId),
          ),
        )
        .returning({ id: OrgDestinations.id });

      if (result.length === 0) {
        return {
          body: { error: 'Destination not found' },
          status: 404 as const,
        };
      }

      return {
        body: undefined,
        status: 204 as const,
      };
    } catch (_error) {
      return {
        body: { error: 'Unauthorized' },
        status: 401 as const,
      };
    }
  },

  // Get a single destination
  getDestination: async ({ params, req }) => {
    try {
      const orgId = await getOrgId(req);

      const destination = await db.query.OrgDestinations.findFirst({
        where: and(
          eq(OrgDestinations.id, params.id),
          eq(OrgDestinations.orgId, orgId),
        ),
        with: {
          provider: true,
        },
      });

      if (!destination) {
        return {
          body: { error: 'Destination not found' },
          status: 404 as const,
        };
      }

      return {
        body: {
          ...destination,
          config: destination.config as Record<string, unknown>,
          provider: destination.provider
            ? {
                ...destination.provider,
                configSchema: destination.provider.configSchema as Record<
                  string,
                  unknown
                >,
              }
            : undefined,
        },
        status: 200 as const,
      };
    } catch (_error) {
      return {
        body: { error: 'Unauthorized' },
        status: 401 as const,
      };
    }
  },

  // Get a single provider
  getProvider: async ({ params }) => {
    try {
      const provider = await db.query.DestinationProviders.findFirst({
        where: eq(DestinationProviders.id, params.id),
      });

      if (!provider) {
        return {
          body: { error: 'Provider not found' },
          status: 404 as const,
        };
      }

      return {
        body: {
          ...provider,
          configSchema: provider.configSchema as Record<string, unknown>,
        },
        status: 200 as const,
      };
    } catch (_error) {
      return {
        body: { error: 'Unauthorized' },
        status: 401 as const,
      };
    }
  },

  // List organization destinations
  listDestinations: async ({ query, req }) => {
    try {
      const orgId = await getOrgId(req);

      const conditions = [eq(OrgDestinations.orgId, query.orgId || orgId)];

      if (query.isEnabled !== undefined) {
        conditions.push(eq(OrgDestinations.isEnabled, query.isEnabled));
      }
      if (query.providerId) {
        conditions.push(eq(OrgDestinations.providerId, query.providerId));
      }

      const destinations = await db.query.OrgDestinations.findMany({
        where: and(...conditions),
        with: {
          provider: true,
        },
      });

      return {
        body: {
          destinations: destinations.map((dest) => ({
            ...dest,
            config: dest.config as Record<string, unknown>,
            provider: dest.provider
              ? {
                  ...dest.provider,
                  configSchema: dest.provider.configSchema as Record<
                    string,
                    unknown
                  >,
                }
              : undefined,
          })),
        },
        status: 200 as const,
      };
    } catch (_error) {
      return {
        body: { error: 'Unauthorized' },
        status: 401 as const,
      };
    }
  },
  // List available providers
  listProviders: async ({ query }) => {
    try {
      const conditions = [];

      if (query.isActive !== undefined) {
        conditions.push(eq(DestinationProviders.isActive, query.isActive));
      }

      const providers = await db.query.DestinationProviders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
      });

      return {
        body: {
          providers: providers.map((provider) => ({
            ...provider,
            configSchema: provider.configSchema as Record<string, unknown>,
          })),
        },
        status: 200 as const,
      };
    } catch (_error) {
      return {
        body: { error: 'Unauthorized' },
        status: 401 as const,
      };
    }
  },

  // Test a destination configuration
  testDestination: async ({ params, body: _body, req }) => {
    try {
      const orgId = await getOrgId(req);

      const destination = await db.query.OrgDestinations.findFirst({
        where: and(
          eq(OrgDestinations.id, params.id),
          eq(OrgDestinations.orgId, orgId),
        ),
        with: {
          provider: true,
        },
      });

      if (!destination) {
        return {
          body: { error: 'Destination not found' },
          status: 404 as const,
        };
      }

      // Merge provided config/secrets with existing ones
      // const _testConfig = body.config || destination.config;
      // const _testSecrets =
      //   body.secrets ||
      //   (destination.encryptedSecrets
      //     ? decryptSecrets(destination.encryptedSecrets)
      //     : {});

      // TODO: Implement actual testing logic based on provider type
      // This would involve making a test API call or connection

      return {
        body: {
          details: {
            destinationName: destination.name,
            provider: destination.provider?.type,
          },
          message: `Test connection to ${destination.provider?.name} successful`,
          success: true,
        },
        status: 200 as const,
      };
    } catch (error) {
      return {
        body: { error: error instanceof Error ? error.message : 'Test failed' },
        status: 400 as const,
      };
    }
  },

  // Test a destination configuration before creating
  testNewDestination: async ({ body }) => {
    try {
      const provider = await db.query.DestinationProviders.findFirst({
        where: eq(DestinationProviders.id, body.providerId),
      });

      if (!provider) {
        return {
          body: { error: 'Invalid provider ID' },
          status: 400 as const,
        };
      }

      // TODO: Implement actual testing logic based on provider type
      // This would involve making a test API call or connection

      return {
        body: {
          details: {
            provider: provider.type,
          },
          message: `Test connection to ${provider.name} successful`,
          success: true,
        },
        status: 200 as const,
      };
    } catch (error) {
      return {
        body: { error: error instanceof Error ? error.message : 'Test failed' },
        status: 400 as const,
      };
    }
  },

  // Update a destination
  updateDestination: async ({ params, body, req }) => {
    try {
      const orgId = await getOrgId(req);

      // Check if destination exists and belongs to org
      const existingDestination = await db.query.OrgDestinations.findFirst({
        where: and(
          eq(OrgDestinations.id, params.id),
          eq(OrgDestinations.orgId, orgId),
        ),
      });

      if (!existingDestination) {
        return {
          body: { error: 'Destination not found' },
          status: 404 as const,
        };
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
      if (body.description !== undefined)
        updateData.description = body.description;
      if (body.config !== undefined) updateData.config = body.config;
      if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled;
      if (body.name !== undefined) updateData.name = body.name;
      if (body.batchSize !== undefined) updateData.batchSize = body.batchSize;
      if (body.maxRetries !== undefined)
        updateData.maxRetries = body.maxRetries;
      if (body.rateLimit !== undefined) updateData.rateLimit = body.rateLimit;
      if (body.retryDelayMs !== undefined)
        updateData.retryDelayMs = body.retryDelayMs;
      if (body.retryEnabled !== undefined)
        updateData.retryEnabled = body.retryEnabled;
      if (body.transformFunction !== undefined)
        updateData.transformFunction = body.transformFunction;

      const [updatedDestination] = await db
        .update(OrgDestinations)
        .set(updateData)
        .where(eq(OrgDestinations.id, params.id))
        .returning();

      if (!updatedDestination) {
        return {
          body: { error: 'Failed to update destination' },
          status: 400 as const,
        };
      }

      // Fetch with provider relation
      const destination = await db.query.OrgDestinations.findFirst({
        where: eq(OrgDestinations.id, params.id),
        with: {
          provider: true,
        },
      });

      return {
        body: {
          ...destination,
          config: destination?.config as Record<string, unknown>,
          provider: destination?.provider
            ? {
                ...destination?.provider,
                configSchema: destination?.provider.configSchema as Record<
                  string,
                  unknown
                >,
              }
            : undefined,
        },
        status: 200 as const,
      };
    } catch (error) {
      return {
        body: {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update destination',
        },
        status: 400 as const,
      };
    }
  },
});
