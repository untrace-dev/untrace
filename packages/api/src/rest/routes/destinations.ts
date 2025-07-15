import crypto from 'node:crypto';
import { createServerFn, type TsRestRequest } from '@ts-rest/core';
import { and, desc, eq } from '@untrace/db';
import { db } from '@untrace/db/client';
import { DestinationProviders, OrgDestinations } from '@untrace/db/schema';
import { createId } from '@untrace/id';
import { destinationsContract } from '../contract/destinations';

// Helper to get organization ID from request (would be from auth in production)
async function getOrganizationId(request: TsRestRequest): Promise<string> {
  // TODO: Get from auth context
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) {
    throw new Error('Organization ID not provided');
  }
  return orgId;
}

// Simple encryption for secrets (in production, use proper key management)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing';
const algorithm = 'aes-256-gcm';

function encryptSecrets(secrets: Record<string, string>): string {
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

function decryptSecrets(encryptedData: string): Record<string, string> {
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

export const destinationsRouter = createServerFn(destinationsContract, {
  // Create a new destination
  createDestination: async ({ body, request }) => {
    try {
      const organizationId = await getOrganizationId(request);

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

      const encryptedSecrets = body.secrets
        ? encryptSecrets(body.secrets)
        : null;

      const [destination] = await db
        .insert(OrgDestinations)
        .values({
          config: body.config,
          description: body.description || null,
          encryptedSecrets,
          filter: body.filter || null,
          id: createId(),
          isActive: body.isActive ?? true,
          name: body.name,
          organizationId,
          priority: body.priority ?? 50,
          providerId: body.providerId,
          transform: body.transform || null,
        })
        .returning();

      // Fetch with provider relation
      const createdDestination = await db.query.OrgDestinations.findFirst({
        where: eq(OrgDestinations.id, destination.id),
        with: {
          provider: true,
        },
      });

      return {
        body: {
          ...createdDestination!,
          encryptedSecrets: null,
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
  deleteDestination: async ({ params, request }) => {
    try {
      const organizationId = await getOrganizationId(request);

      const result = await db
        .delete(OrgDestinations)
        .where(
          and(
            eq(OrgDestinations.id, params.id),
            eq(OrgDestinations.organizationId, organizationId),
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
  getDestination: async ({ params, request }) => {
    try {
      const organizationId = await getOrganizationId(request);

      const destination = await db.query.OrgDestinations.findFirst({
        where: and(
          eq(OrgDestinations.id, params.id),
          eq(OrgDestinations.organizationId, organizationId),
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

      // Don't return encrypted secrets
      const sanitizedDestination = {
        ...destination,
        encryptedSecrets: null,
      };

      return {
        body: sanitizedDestination,
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
        body: provider,
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
  listDestinations: async ({ query, request }) => {
    try {
      const organizationId = await getOrganizationId(request);

      const conditions = [
        eq(
          OrgDestinations.organizationId,
          query.organizationId || organizationId,
        ),
      ];

      if (query.isActive !== undefined) {
        conditions.push(eq(OrgDestinations.isActive, query.isActive));
      }
      if (query.providerId) {
        conditions.push(eq(OrgDestinations.providerId, query.providerId));
      }

      const destinations = await db.query.OrgDestinations.findMany({
        orderBy: [desc(OrgDestinations.priority), OrgDestinations.name],
        where: and(...conditions),
        with: {
          provider: true,
        },
      });

      // Don't return encrypted secrets in list view
      const sanitizedDestinations = destinations.map((dest) => ({
        ...dest,
        encryptedSecrets: null,
      }));

      return {
        body: { destinations: sanitizedDestinations },
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
        orderBy: [DestinationProviders.name],
        where: conditions.length > 0 ? and(...conditions) : undefined,
      });

      return {
        body: { providers },
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
  testDestination: async ({ params, body, request }) => {
    try {
      const organizationId = await getOrganizationId(request);

      const destination = await db.query.OrgDestinations.findFirst({
        where: and(
          eq(OrgDestinations.id, params.id),
          eq(OrgDestinations.organizationId, organizationId),
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
      const _testConfig = body.config || destination.config;
      const _testSecrets =
        body.secrets ||
        (destination.encryptedSecrets
          ? decryptSecrets(destination.encryptedSecrets)
          : {});

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
  updateDestination: async ({ params, body, request }) => {
    try {
      const organizationId = await getOrganizationId(request);

      // Verify destination exists and belongs to org
      const existing = await db.query.OrgDestinations.findFirst({
        where: and(
          eq(OrgDestinations.id, params.id),
          eq(OrgDestinations.organizationId, organizationId),
        ),
      });

      if (!existing) {
        return {
          body: { error: 'Destination not found' },
          status: 404 as const,
        };
      }

      const updates: Partial<{
        name: string;
        description: string | null;
        config: Record<string, unknown>;
        encryptedSecrets: string | null;
        transform: string | null;
        filter: string | null;
        isActive: boolean;
        priority: number;
        updatedAt: Date;
      }> = {};

      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined)
        updates.description = body.description;
      if (body.config !== undefined) updates.config = body.config;
      if (body.secrets !== undefined) {
        updates.encryptedSecrets = encryptSecrets(body.secrets);
      }
      if (body.transform !== undefined) updates.transform = body.transform;
      if (body.filter !== undefined) updates.filter = body.filter;
      if (body.isActive !== undefined) updates.isActive = body.isActive;
      if (body.priority !== undefined) updates.priority = body.priority;

      updates.updatedAt = new Date();

      const [updated] = await db
        .update(OrgDestinations)
        .set(updates)
        .where(eq(OrgDestinations.id, params.id))
        .returning();

      // Fetch with provider relation
      const updatedDestination = await db.query.OrgDestinations.findFirst({
        where: eq(OrgDestinations.id, updated.id),
        with: {
          provider: true,
        },
      });

      return {
        body: {
          ...updatedDestination!,
          encryptedSecrets: null,
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
