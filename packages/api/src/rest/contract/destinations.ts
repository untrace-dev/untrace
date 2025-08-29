import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Shared schemas
const destinationIdSchema = z.string().uuid();
const providerIdSchema = z.string().uuid();

const destinationProviderSchema = z.object({
  configSchema: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  defaultTransform: z.string().nullable(),
  description: z.string().nullable(),
  id: z.string().uuid(),
  isActive: z.boolean(),
  name: z.string(),
  supportsBatchDelivery: z.boolean(),
  supportsCustomTransform: z.boolean(),
  supportsOpenTelemetry: z.boolean(),
  type: z.enum([
    'langfuse',
    'openai',
    'langsmith',
    'keywords_ai',
    's3',
    'webhook',
    'datadog',
    'new_relic',
    'grafana',
    'prometheus',
    'elasticsearch',
    'custom',
  ] as const),
  updatedAt: z.date().nullable(),
});

const orgDestinationSchema = z.object({
  batchSize: z.number().nullable(),
  config: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  description: z.string().nullable(),
  id: z.string().uuid(),
  isEnabled: z.boolean(),
  maxRetries: z.number(),
  name: z.string(),
  orgId: z.string(),
  provider: destinationProviderSchema.optional(),
  providerId: z.string().uuid(),
  rateLimit: z.number().nullable(),
  retryDelayMs: z.number(),
  retryEnabled: z.boolean(),
  transformFunction: z.string().nullable(),
  updatedAt: z.date().nullable(),
});

const createDestinationSchema = z.object({
  batchSize: z.number().optional(),
  config: z.record(z.string(), z.unknown()),
  description: z.string().max(1000).optional(),
  isEnabled: z.boolean().default(true),
  maxRetries: z.number().optional(),
  name: z.string().min(1).max(255),
  providerId: providerIdSchema,
  rateLimit: z.number().optional(),
  retryDelayMs: z.number().optional(),
  retryEnabled: z.boolean().optional(),
  transformFunction: z.string().optional(),
});

const updateDestinationSchema = createDestinationSchema
  .partial()
  .omit({ providerId: true });

const testDestinationSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  sampleTrace: z.record(z.string(), z.unknown()).optional(),
});

// API Contract
export const destinationsContract = c.router(
  {
    // Create a new destination
    createDestination: {
      body: createDestinationSchema,
      method: 'POST',
      path: '/destinations',
      responses: {
        201: orgDestinationSchema,
        400: z.object({ error: z.string(), message: z.string() }),
        401: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'Create a new destination for the organization',
    },

    // Delete a destination
    deleteDestination: {
      method: 'DELETE',
      path: '/destinations/:id',
      pathParams: z.object({
        id: destinationIdSchema,
      }),
      responses: {
        204: z.undefined(),
        401: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'Delete a destination',
    },

    // Get a single destination
    getDestination: {
      method: 'GET',
      path: '/destinations/:id',
      pathParams: z.object({
        id: destinationIdSchema,
      }),
      responses: {
        200: orgDestinationSchema,
        401: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string() }),
      },
      summary: 'Get a destination by ID',
    },

    // Get a single provider
    getProvider: {
      method: 'GET',
      path: '/destination-providers/:id',
      pathParams: z.object({
        id: providerIdSchema,
      }),
      responses: {
        200: destinationProviderSchema,
        401: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'Get a destination provider by ID',
    },

    // List organization destinations
    listDestinations: {
      method: 'GET',
      path: '/destinations',
      query: z.object({
        isEnabled: z.boolean().optional(),
        orgId: z.string().optional(),
        providerId: providerIdSchema.optional(),
      }),
      responses: {
        200: z.object({
          destinations: z.array(orgDestinationSchema),
        }),
        401: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'List organization destinations',
    },
    // List available providers
    listProviders: {
      method: 'GET',
      path: '/destination-providers',
      query: z.object({
        isActive: z.boolean().optional(),
      }),
      responses: {
        200: z.object({
          providers: z.array(destinationProviderSchema),
        }),
        401: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'List available destination providers',
    },

    // Test a destination configuration
    testDestination: {
      body: testDestinationSchema,
      method: 'POST',
      path: '/destinations/:id/test',
      pathParams: z.object({
        id: destinationIdSchema,
      }),
      responses: {
        200: z.object({
          details: z.record(z.string(), z.unknown()).optional(),
          message: z.string(),
          success: z.boolean(),
        }),
        400: z.object({ error: z.string(), message: z.string() }),
        401: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'Test a destination configuration',
    },

    // Test a destination configuration before creating
    testNewDestination: {
      body: z.object({
        config: z.record(z.string(), z.unknown()),
        providerId: providerIdSchema,
        sampleTrace: z.record(z.string(), z.unknown()).optional(),
      }),
      method: 'POST',
      path: '/destinations/test',
      responses: {
        200: z.object({
          details: z.record(z.string(), z.unknown()).optional(),
          message: z.string(),
          success: z.boolean(),
        }),
        400: z.object({ error: z.string(), message: z.string() }),
        401: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'Test a destination configuration before creating',
    },

    // Update a destination
    updateDestination: {
      body: updateDestinationSchema,
      method: 'PATCH',
      path: '/destinations/:id',
      pathParams: z.object({
        id: destinationIdSchema,
      }),
      responses: {
        200: orgDestinationSchema,
        400: z.object({ error: z.string(), message: z.string() }),
        401: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
      summary: 'Update a destination',
    },
  },
  {
    strictStatusCodes: true,
  },
);

export type DestinationsContract = typeof destinationsContract;
