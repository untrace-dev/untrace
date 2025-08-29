import { createNextRoute } from '@ts-rest/next';
import { and, desc, eq, gte, lte, sql } from '@untrace/db';
import { db } from '@untrace/db/client';
import { TraceDeliveries, Traces } from '@untrace/db/schema';
import { createId } from '@untrace/id';
import { addDays } from 'date-fns';
import type { NextApiRequest } from 'next';
import { tracesContract } from '../contract/traces';

// Helper to get organization ID from request (would be from auth in production)
async function getOrgId(req: NextApiRequest): Promise<string> {
  // TODO: Get from auth context
  const orgId = req.headers['x-organization-id'];
  if (!orgId) {
    throw new Error('Organization ID not provided');
  }
  return orgId as string;
}

export const tracesRouter = createNextRoute(tracesContract, {
  // Create a new trace
  createTrace: async ({ body, req }) => {
    try {
      const orgId = await getOrgId(req);
      const expiresAt = addDays(new Date(), body.ttlDays || 30);

      const [trace] = await db
        .insert(Traces)
        .values({
          data: body.data,
          expiresAt,
          id: createId(),
          orgId,
          spanId: body.spanId || null,
          traceId: body.traceId,
        })
        .returning();

      if (!trace) {
        throw new Error('Failed to create trace');
      }

      return {
        body: trace,
        status: 201 as const,
      };
    } catch (error) {
      return {
        body: {
          error:
            error instanceof Error ? error.message : 'Failed to create trace',
        },
        status: 400 as const,
      };
    }
  },

  // Delete a trace
  deleteTrace: async ({ params, req }) => {
    try {
      const orgId = await getOrgId(req);

      const result = await db
        .delete(Traces)
        .where(and(eq(Traces.id, params.id), eq(Traces.orgId, orgId)))
        .returning({ id: Traces.id });

      if (result.length === 0) {
        return {
          body: { error: 'Trace not found' },
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

  // Get a single trace
  getTrace: async ({ params, req }) => {
    try {
      const orgId = await getOrgId(req);

      const trace = await db.query.Traces.findFirst({
        where: and(eq(Traces.id, params.id), eq(Traces.orgId, orgId)),
      });

      if (!trace) {
        return {
          body: { error: 'Trace not found' },
          status: 404 as const,
        };
      }

      return {
        body: trace,
        status: 200 as const,
      };
    } catch (_error) {
      return {
        body: { error: 'Unauthorized' },
        status: 401 as const,
      };
    }
  },

  // Get trace deliveries
  getTraceDeliveries: async ({ params, query, req }) => {
    try {
      const orgId = await getOrgId(req);

      // First verify the trace belongs to the organization
      const trace = await db.query.Traces.findFirst({
        where: and(eq(Traces.id, params.id), eq(Traces.orgId, orgId)),
      });

      if (!trace) {
        return {
          body: { error: 'Trace not found' },
          status: 404 as const,
        };
      }

      const [deliveriesList, totalResult] = await Promise.all([
        db.query.TraceDeliveries.findMany({
          limit: query.limit,
          offset: query.offset,
          orderBy: [desc(TraceDeliveries.createdAt)],
          where: eq(TraceDeliveries.traceId, params.id),
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(TraceDeliveries)
          .where(eq(TraceDeliveries.traceId, params.id)),
      ]);

      return {
        body: {
          deliveries: deliveriesList.map((delivery) => ({
            ...delivery,
            responseData: delivery.responseData as unknown,
            transformedPayload: delivery.transformedPayload as unknown,
          })),
          limit: query.limit,
          offset: query.offset,
          total: Number(totalResult[0]?.count || 0),
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

  // List traces with filtering
  listTraces: async ({ query, req }) => {
    try {
      const orgId = await getOrgId(req);

      const conditions = [eq(Traces.orgId, query.organizationId || orgId)];

      if (query.traceId) {
        conditions.push(eq(Traces.traceId, query.traceId));
      }
      if (query.spanId) {
        conditions.push(eq(Traces.spanId, query.spanId));
      }
      if (query.createdAfter) {
        conditions.push(gte(Traces.createdAt, query.createdAfter));
      }
      if (query.createdBefore) {
        conditions.push(lte(Traces.createdAt, query.createdBefore));
      }

      const [tracesList, totalResult] = await Promise.all([
        db.query.Traces.findMany({
          limit: query.limit,
          offset: query.offset,
          orderBy: [desc(Traces.createdAt)],
          where: and(...conditions),
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(Traces)
          .where(and(...conditions)),
      ]);

      return {
        body: {
          limit: query.limit,
          offset: query.offset,
          total: Number(totalResult[0]?.count || 0),
          traces: tracesList,
        },
        status: 200 as const,
      };
    } catch (error) {
      return {
        body: {
          error:
            error instanceof Error ? error.message : 'Failed to list traces',
        },
        status: 400 as const,
      };
    }
  },

  // Retry a failed delivery
  retryDelivery: async ({ params, req }) => {
    try {
      const orgId = await getOrgId(req);

      // First verify the trace belongs to the organization
      const trace = await db.query.Traces.findFirst({
        where: and(eq(Traces.id, params.traceId), eq(Traces.orgId, orgId)),
      });

      if (!trace) {
        return {
          body: { error: 'Trace not found' },
          status: 404 as const,
        };
      }

      // Get the delivery
      const delivery = await db.query.TraceDeliveries.findFirst({
        where: and(
          eq(TraceDeliveries.id, params.deliveryId),
          eq(TraceDeliveries.traceId, params.traceId),
        ),
      });

      if (!delivery) {
        return {
          body: { error: 'Delivery not found' },
          status: 404 as const,
        };
      }

      if (delivery.status === 'success') {
        return {
          body: { error: 'Delivery already successful' },
          status: 409 as const,
        };
      }

      // Update delivery to pending for retry
      const [updatedDelivery] = await db
        .update(TraceDeliveries)
        .set({
          nextRetryAt: new Date(),
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(TraceDeliveries.id, params.deliveryId))
        .returning();

      if (!updatedDelivery) {
        return {
          body: { error: 'Failed to update delivery' },
          status: 404 as const,
        };
      }

      // TODO: Trigger actual delivery retry via queue

      return {
        body: {
          ...updatedDelivery,
          responseData: updatedDelivery.responseData as unknown,
          transformedPayload: updatedDelivery.transformedPayload as unknown,
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
});
