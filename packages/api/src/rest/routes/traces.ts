import { ORPCError, os } from '@orpc/server';
import { and, desc, eq, gte, lte, sql } from '@untrace/db';
import { db } from '@untrace/db/client';
import { Deliveries, Traces } from '@untrace/db/schema';
import { createTraceFanoutService } from '@untrace/destinations';
import { createId } from '@untrace/id';
import { addDays } from 'date-fns';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { apiKeyAuthMiddleware } from '../middleware/auth';

// Use Drizzle-generated schemas exclusively
const TraceSelectSchema = createSelectSchema(Traces);
const TraceDeliverySelectSchema = createSelectSchema(Deliveries);

// OTLP types
interface OTLPAttribute {
  key: string;
  value: OTLPValue;
}

interface OTLPValue {
  stringValue?: string;
  boolValue?: boolean;
  intValue?: number;
  doubleValue?: number;
  arrayValue?: {
    values: OTLPValue[];
  };
  kvlistValue?: {
    values: OTLPAttribute[];
  };
}

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

// Helper function to convert OTLP attributes to plain object
function convertOTLPAttributes(
  attributes: OTLPAttribute[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const attr of attributes) {
    const value = convertOTLPValue(attr.value);
    if (value !== undefined && value !== null) {
      result[attr.key] = value;
    }
  }

  return result;
}

// Helper function to convert OTLP value to plain value
function convertOTLPValue(value: OTLPValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.intValue !== undefined) return value.intValue;
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.arrayValue) {
    return value.arrayValue.values.map(convertOTLPValue);
  }
  if (value.kvlistValue) {
    return convertOTLPAttributes(value.kvlistValue.values);
  }
  return undefined;
}

// OTLP constants
const ATTR_LLM_MODEL = 'llm.model';

// oRPC handlers
export const create = os
  .route({ method: 'POST', path: '/traces' })
  .input(
    z.object({
      data: z.record(z.string(), z.unknown()),
      expiresAt: z.date().optional(),
      spanId: z.string().optional(),
      traceId: z.string(),
      ttlDays: z.number().int().positive().optional(),
    }),
  )
  .output(TraceSelectSchema)
  .use(apiKeyAuthMiddleware)
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);
      const expiresAt = addDays(new Date(), input.ttlDays || 30);

      const [trace] = await db
        .insert(Traces)
        .values({
          data: input.data,
          expiresAt,
          id: createId(),
          orgId,
          projectId: context.apiKey.projectId,
          spanId: input.spanId || null,
          traceId: input.traceId,
        })
        .returning();

      if (!trace) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Failed to create trace',
        });
      }

      return trace;
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Failed to create trace',
      });
    }
  });
export const byId = os
  .route({ method: 'GET', path: '/traces/{id}' })
  .input(z.object({ id: z.coerce.string() }))
  .output(TraceSelectSchema)
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      const trace = await db.query.Traces.findFirst({
        where: and(eq(Traces.id, input.id), eq(Traces.orgId, orgId)),
      });

      if (!trace) {
        throw new ORPCError('NOT_FOUND', { message: 'Trace not found' });
      }

      return trace;
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const deliveries = os
  .route({ method: 'GET', path: '/traces/{id}/deliveries' })
  .input(
    z.object({
      id: z.coerce.string(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    }),
  )
  .output(
    z.object({
      deliveries: z.array(TraceDeliverySelectSchema),
      limit: z.number().optional(),
      offset: z.number().optional(),
      total: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      // First verify the trace belongs to the organization
      const trace = await db.query.Traces.findFirst({
        where: and(eq(Traces.id, input.id), eq(Traces.orgId, orgId)),
      });

      if (!trace) {
        throw new ORPCError('NOT_FOUND', { message: 'Trace not found' });
      }

      const [deliveriesList, totalResult] = await Promise.all([
        db.query.Deliveries.findMany({
          limit: input.limit,
          offset: input.offset,
          orderBy: [desc(Deliveries.createdAt)],
          where: eq(Deliveries.traceId, input.id),
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(Deliveries)
          .where(eq(Deliveries.traceId, input.id)),
      ]);

      return {
        deliveries: deliveriesList,
        limit: input.limit,
        offset: input.offset,
        total: Number(totalResult[0]?.count || 0),
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const all = os
  .route({ method: 'GET', path: '/traces' })
  .input(
    z.object({
      createdAfter: z.coerce.date().optional(),
      createdBefore: z.coerce.date().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      offset: z.coerce.number().int().min(0).optional(),
      organizationId: z.string().optional(),
      spanId: z.string().optional(),
      traceId: z.string().optional(),
    }),
  )
  .output(
    z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      total: z.number(),
      traces: z.array(TraceSelectSchema),
    }),
  )
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      const conditions: ReturnType<typeof eq>[] = [
        eq(Traces.orgId, input.organizationId || orgId),
      ];

      if (input.traceId) {
        conditions.push(eq(Traces.traceId, input.traceId));
      }
      if (input.spanId) {
        conditions.push(eq(Traces.spanId, input.spanId));
      }
      if (input.createdAfter) {
        conditions.push(gte(Traces.createdAt, input.createdAfter));
      }
      if (input.createdBefore) {
        conditions.push(lte(Traces.createdAt, input.createdBefore));
      }

      const [tracesList, totalResult] = await Promise.all([
        db.query.Traces.findMany({
          limit: input.limit,
          offset: input.offset,
          orderBy: [desc(Traces.createdAt)],
          where: and(...conditions),
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(Traces)
          .where(and(...conditions)),
      ]);

      return {
        limit: input.limit,
        offset: input.offset,
        total: Number(totalResult[0]?.count || 0),
        traces: tracesList,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error ? error.message : 'Failed to list traces',
      });
    }
  });

export const retry = os
  .route({
    method: 'POST',
    path: '/traces/{traceId}/deliveries/{deliveryId}/retry',
  })
  .input(
    z.object({
      deliveryId: z.coerce.string(),
      traceId: z.coerce.string(),
    }),
  )
  .output(TraceDeliverySelectSchema)
  .handler(async ({ input, context }) => {
    try {
      const orgId = await getOrgId(context);

      // First verify the trace belongs to the organization
      const trace = await db.query.Traces.findFirst({
        where: and(eq(Traces.id, input.traceId), eq(Traces.orgId, orgId)),
      });

      if (!trace) {
        throw new ORPCError('NOT_FOUND', { message: 'Trace not found' });
      }

      // Get the delivery
      const delivery = await db.query.Deliveries.findFirst({
        where: and(
          eq(Deliveries.id, input.deliveryId),
          eq(Deliveries.traceId, input.traceId),
        ),
      });

      if (!delivery) {
        throw new ORPCError('NOT_FOUND', { message: 'Delivery not found' });
      }

      if (delivery.status === 'success') {
        throw new ORPCError('CONFLICT', {
          message: 'Delivery already successful',
        });
      }

      // Update delivery to pending for retry
      const [updatedDelivery] = await db
        .update(Deliveries)
        .set({
          nextRetryAt: new Date(),
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(Deliveries.id, input.deliveryId))
        .returning();

      if (!updatedDelivery) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Failed to update delivery',
        });
      }

      // TODO: Trigger actual delivery retry via queue

      return updatedDelivery;
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' });
    }
  });

export const ingest = os
  .route({ method: 'POST', path: '/traces/otlp' })
  .input(
    z.object({
      resourceSpans: z.array(
        z.object({
          resource: z.object({
            attributes: z.array(
              z.object({
                key: z.string(),
                value: z.object({
                  arrayValue: z
                    .object({
                      values: z.array(z.any()),
                    })
                    .optional(),
                  boolValue: z.boolean().optional(),
                  doubleValue: z.number().optional(),
                  intValue: z.number().optional(),
                  kvlistValue: z
                    .object({
                      values: z.array(z.any()),
                    })
                    .optional(),
                  stringValue: z.string().optional(),
                }),
              }),
            ),
          }),
          scopeSpans: z.array(
            z.object({
              scope: z.object({
                name: z.string(),
                version: z.string().optional(),
              }),
              spans: z.array(
                z.object({
                  attributes: z.array(z.any()),
                  endTimeUnixNano: z.string(),
                  events: z.array(z.any()),
                  kind: z.number(),
                  links: z.array(z.any()),
                  name: z.string(),
                  parentSpanId: z.string().optional(),
                  spanId: z.string(),
                  startTimeUnixNano: z.string(),
                  status: z.object({
                    code: z.number(),
                    message: z.string().optional(),
                  }),
                  traceId: z.string(),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      tracesProcessed: z.number(),
    }),
  )
  .use(apiKeyAuthMiddleware)
  .handler(async ({ input, context }) => {
    try {
      // Initialize fanout service
      const fanoutService = createTraceFanoutService();

      const traces: Array<{
        data: Record<string, unknown>;
        expiresAt: Date;
        id: string;
        orgId: string;
        parentSpanId: string | null;
        projectId: string;
        spanId: string;
        traceId: string;
      }> = [];

      for (const resourceSpan of input.resourceSpans) {
        const resourceAttributes = convertOTLPAttributes(
          resourceSpan.resource.attributes,
        );

        for (const scopeSpan of resourceSpan.scopeSpans) {
          for (const span of scopeSpan.spans) {
            // Convert span to trace format
            const spanAttributes = convertOTLPAttributes(span.attributes);

            // Extract LLM-specific data
            const llmData: Record<string, unknown> = {
              error: null,
              request: {},
              response: {},
            };

            // Extract request data
            if (spanAttributes['llm.operation.type']) {
              llmData.request = {
                max_tokens: spanAttributes['llm.max_tokens'],
                messages: spanAttributes['llm.messages'] || [],
                model:
                  spanAttributes['llm.model'] || spanAttributes[ATTR_LLM_MODEL],
                stream: spanAttributes['llm.stream'],
                temperature: spanAttributes['llm.temperature'],
              };
            }

            // Extract response data
            if (spanAttributes['llm.total.tokens']) {
              llmData.response = {
                choices: spanAttributes['llm.choices'] || [],
                usage: {
                  completion_tokens: spanAttributes['llm.completion.tokens'],
                  prompt_tokens: spanAttributes['llm.prompt.tokens'],
                  total_tokens: spanAttributes['llm.total.tokens'],
                },
              };
            }

            // Extract error data
            if (span.status.code === 1) {
              // ERROR status
              llmData.error = {
                message: span.status.message,
                type: spanAttributes['llm.error.type'],
              };
            }

            // If this is an LLM operation, try to extract more detailed data
            if (spanAttributes['llm.operation.type'] === 'chat') {
              // Look for request/response data in span events
              for (const event of span.events) {
                const eventAttributes = convertOTLPAttributes(event.attributes);

                if (event.name === 'llm.request') {
                  llmData.request = {
                    ...(llmData.request as Record<string, unknown>),
                    ...eventAttributes,
                  };
                } else if (event.name === 'llm.response') {
                  llmData.response = {
                    ...(llmData.response as Record<string, unknown>),
                    ...eventAttributes,
                  };
                }
              }
            }

            // Create trace record
            const trace = {
              data: {
                ...llmData,
                resource: resourceAttributes,
                scope: {
                  name: scopeSpan.scope.name,
                  version: scopeSpan.scope.version,
                },
                span: {
                  attributes: spanAttributes,
                  endTime: span.endTimeUnixNano,
                  events: span.events,
                  kind: span.kind,
                  links: span.links,
                  name: span.name,
                  startTime: span.startTimeUnixNano,
                },
              },
              expiresAt: addDays(new Date(), 30), // 30 days TTL
              id: createId(),
              orgId: context.apiKey.orgId,
              parentSpanId: span.parentSpanId || null,
              projectId: context.apiKey.projectId,
              spanId: span.spanId,
              traceId: span.traceId,
            };

            traces.push(trace);
          }
        }
      }

      // Insert traces into database
      if (traces.length > 0) {
        await db.insert(Traces).values(traces);

        // Process fanout to all destinations
        const fanoutContext = {
          orgId: context.apiKey.orgId,
          projectId: context.apiKey.projectId,
          userId: (context as { auth?: { userId?: string } }).auth?.userId,
        };

        // Convert traces to TraceData format for fanout
        const traceDataArray = traces.map((trace) => ({
          createdAt: new Date(),
          data: trace.data,
          expiresAt: trace.expiresAt,
          metadata: {},
          orgId: trace.orgId,
          parentSpanId: trace.parentSpanId || undefined,
          spanId: trace.spanId || undefined,
          traceId: trace.traceId,
          userId: (context as { auth?: { userId?: string } }).auth?.userId,
        }));

        // Process fanout asynchronously (don't wait for completion)
        fanoutService
          .processTraces(traceDataArray, fanoutContext)
          .catch((error) => {
            console.error('Fanout processing failed:', error);
          });
      }

      return {
        success: true,
        tracesProcessed: traces.length,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('BAD_REQUEST', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to ingest OTLP traces',
      });
    }
  });

// Export the traces router
export const tracesRouter = os.router({
  all,
  byId,
  create,
  deliveries,
  ingest,
  retry,
});
