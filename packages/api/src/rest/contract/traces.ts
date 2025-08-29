import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Shared schemas
const traceIdSchema = z.string().uuid();
const _spanIdSchema = z.string();
const _organizationIdSchema = z.string();

const traceSchema = z.object({
  createdAt: z.date(),
  data: z.record(z.string(), z.unknown()),
  expiresAt: z.date(),
  id: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  orgId: z.string(),
  parentSpanId: z.string().nullable(),
  spanId: z.string().nullable(),
  traceId: z.string(),
  updatedAt: z.date().nullable(),
  userId: z.string().nullable(),
});

const createTraceSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  spanId: z.string().optional(),
  traceId: z.string(),
  ttlDays: z.number().int().min(1).max(365).default(30),
});

const traceDeliverySchema = z.object({
  attempts: z.number().int(),
  createdAt: z.date(),
  deliveredAt: z.date().nullable(),
  destinationId: z.string().uuid(),
  id: z.string().uuid(),
  lastError: z.string().nullable(),
  lastErrorAt: z.date().nullable(),
  nextRetryAt: z.date().nullable(),
  responseData: z.record(z.string(), z.unknown()).nullable(),
  status: z.enum([
    'pending',
    'success',
    'failed',
    'retrying',
    'cancelled',
  ] as const),
  traceId: z.string().uuid(),
  transformedPayload: z.record(z.string(), z.unknown()).nullable(),
  updatedAt: z.date().nullable(),
});

const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const tracesFilterSchema = z.object({
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  organizationId: z.string().optional(),
  spanId: z.string().optional(),
  traceId: z.string().optional(),
});

// API Contract
export const tracesContract = c.router(
  {
    // Create a new trace
    createTrace: {
      body: createTraceSchema,
      description: 'Store a new trace with the specified data and TTL',
      method: 'POST',
      path: '/traces',
      responses: {
        201: traceSchema,
        400: z.object({ error: z.string() }),
        401: z.object({ error: z.string() }),
      },
      summary: 'Create a new trace',
    },

    // Delete a trace
    deleteTrace: {
      method: 'DELETE',
      path: '/traces/:id',
      pathParams: z.object({
        id: traceIdSchema,
      }),
      responses: {
        204: z.undefined(),
        401: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
      summary: 'Delete a trace',
    },

    // Get a single trace
    getTrace: {
      method: 'GET',
      path: '/traces/:id',
      pathParams: z.object({
        id: traceIdSchema,
      }),
      responses: {
        200: traceSchema,
        401: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
      summary: 'Get a trace by ID',
    },

    // Get trace deliveries
    getTraceDeliveries: {
      method: 'GET',
      path: '/traces/:id/deliveries',
      pathParams: z.object({
        id: traceIdSchema,
      }),
      query: paginationSchema,
      responses: {
        200: z.object({
          deliveries: z.array(traceDeliverySchema),
          limit: z.number(),
          offset: z.number(),
          total: z.number(),
        }),
        401: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
      summary: 'Get delivery status for a trace',
    },

    // List traces with filtering
    listTraces: {
      method: 'GET',
      path: '/traces',
      query: tracesFilterSchema.merge(paginationSchema),
      responses: {
        200: z.object({
          limit: z.number(),
          offset: z.number(),
          total: z.number(),
          traces: z.array(traceSchema),
        }),
        400: z.object({ error: z.string() }),
        401: z.object({ error: z.string() }),
      },
      summary: 'List traces with optional filtering',
    },

    // Retry a failed delivery
    retryDelivery: {
      body: z.undefined(),
      method: 'POST',
      path: '/traces/:traceId/deliveries/:deliveryId/retry',
      pathParams: z.object({
        deliveryId: z.string().uuid(),
        traceId: traceIdSchema,
      }),
      responses: {
        200: traceDeliverySchema,
        401: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
        409: z.object({ error: z.string() }), // Conflict if already delivered
      },
      summary: 'Retry a failed trace delivery',
    },
  },
  {
    strictStatusCodes: true,
  },
);

export type TracesContract = typeof tracesContract;
