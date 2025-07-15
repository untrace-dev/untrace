import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Shared schemas
const destinationIdSchema = z.string().uuid();
const providerIdSchema = z.string().uuid();

const destinationProviderSchema = z.object({
  configSchema: z.record(z.unknown()),
  createdAt: z.date(),
  description: z.string().nullable(),
  id: z.string().uuid(),
  isActive: z.boolean(),
  name: z.string(),
  type: z.enum([
    'langfuse',
    'openai',
    'langsmith',
    'keywords_ai',
    's3',
    'webhook',
    'datadog',
    'other',
  ] as const),
  updatedAt: z.date(),
});

const orgDestinationSchema = z.object({
  config: z.record(z.unknown()),
  createdAt: z.date(),
  description: z.string().nullable(),
  encryptedSecrets: z.string().nullable(),
  filter: z.string().nullable(),
  id: z.string().uuid(),
  isActive: z.boolean(),
  name: z.string(),
  organizationId: z.string(),
  priority: z.number().int(),
  provider: destinationProviderSchema.optional(),
  providerId: z.string().uuid(),
  transform: z.string().nullable(),
  updatedAt: z.date(),
});

const createDestinationSchema = z.object({
  config: z.record(z.unknown()),
  description: z.string().max(1000).optional(),
  filter: z.string().optional(),
  isActive: z.boolean().default(true),
  name: z.string().min(1).max(255),
  priority: z.number().int().min(0).max(100).default(50),
  providerId: providerIdSchema,
  secrets: z.record(z.string()).optional(),
  transform: z.string().optional(),
});

const updateDestinationSchema = createDestinationSchema
  .partial()
  .omit({ providerId: true });

const testDestinationSchema = z.object({
  config: z.record(z.unknown()).optional(),
  sampleTrace: z.record(z.unknown()).optional(),
  secrets: z.record(z.string()).optional(),
});

// API Contract
export const destinationsContract = c.router({
  // Create a new destination
  createDestination: {
    body: createDestinationSchema,
    method: 'POST',
    path: '/destinations',
    responses: {
      201: orgDestinationSchema,
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
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
      401: z.object({ error: z.string() }),
      404: z.object({ error: z.string() }),
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
      401: z.object({ error: z.string() }),
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
      401: z.object({ error: z.string() }),
      404: z.object({ error: z.string() }),
    },
    summary: 'Get a destination provider by ID',
  },

  // List organization destinations
  listDestinations: {
    method: 'GET',
    path: '/destinations',
    query: z.object({
      isActive: z.boolean().optional(),
      organizationId: z.string().optional(),
      providerId: providerIdSchema.optional(),
    }),
    responses: {
      200: z.object({
        destinations: z.array(orgDestinationSchema),
      }),
      401: z.object({ error: z.string() }),
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
      401: z.object({ error: z.string() }),
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
        details: z.record(z.unknown()).optional(),
        message: z.string(),
        success: z.boolean(),
      }),
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
      404: z.object({ error: z.string() }),
    },
    summary: 'Test a destination configuration',
  },

  // Test a destination configuration before creating
  testNewDestination: {
    body: z.object({
      config: z.record(z.unknown()),
      providerId: providerIdSchema,
      sampleTrace: z.record(z.unknown()).optional(),
      secrets: z.record(z.string()).optional(),
    }),
    method: 'POST',
    path: '/destinations/test',
    responses: {
      200: z.object({
        details: z.record(z.unknown()).optional(),
        message: z.string(),
        success: z.boolean(),
      }),
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
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
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
      404: z.object({ error: z.string() }),
    },
    summary: 'Update a destination',
  },
});

export type DestinationsContract = typeof destinationsContract;
