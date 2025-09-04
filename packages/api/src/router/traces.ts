import { db } from '@untrace/db/client';
import { ApiKeys, Traces } from '@untrace/db/schema';
import { createId } from '@untrace/id';
import { addDays } from 'date-fns';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const tracesRouter = createTRPCRouter({
  analytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        projectId: z.string().optional(),
      }),
    )
    .output(
      z.object({
        dailyTraces: z.array(
          z.object({
            count: z.number(),
            date: z.string(),
          }),
        ),
        latencyStats: z.object({
          average: z.number(),
          p50: z.number(),
          p95: z.number(),
          p99: z.number(),
        }),
        totalTraces: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const { days, projectId } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const conditions = [eq(Traces.orgId, ctx.auth.orgId)];
      if (projectId) {
        conditions.push(eq(Traces.projectId, projectId));
      }
      conditions.push(gte(Traces.createdAt, startDate));

      // Get all traces for the period
      const traces = await db.query.Traces.findMany({
        orderBy: [desc(Traces.createdAt)],
        where: and(...conditions),
      });

      // Calculate daily trace counts
      const dailyCounts: Record<string, number> = {};
      traces.forEach((trace) => {
        const date =
          new Date(trace.createdAt).toISOString().split('T')[0] || 'unknown';
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      const dailyTraces = Object.entries(dailyCounts).map(([date, count]) => ({
        count,
        date,
      }));

      // Calculate latency statistics
      const latencies: number[] = [];
      traces.forEach((trace) => {
        const traceData = trace.data as Record<string, unknown>;
        if (
          traceData.llm_generation &&
          typeof traceData.llm_generation === 'object' &&
          traceData.llm_generation !== null
        ) {
          const llmGen = traceData.llm_generation as { latency?: number };
          if (llmGen.latency) {
            latencies.push(llmGen.latency);
          }
        }
      });

      latencies.sort((a, b) => a - b);
      const latencyStats = {
        average:
          latencies.length > 0
            ? Math.round(
                latencies.reduce((sum, val) => sum + val, 0) / latencies.length,
              )
            : 0,
        p50:
          latencies.length > 0
            ? latencies[Math.floor(latencies.length * 0.5)] || 0
            : 0,
        p95:
          latencies.length > 0
            ? latencies[Math.floor(latencies.length * 0.95)] || 0
            : 0,
        p99:
          latencies.length > 0
            ? latencies[Math.floor(latencies.length * 0.99)] || 0
            : 0,
      };

      return {
        dailyTraces,
        latencyStats,
        totalTraces: traces.length,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        createdAfter: z.date().optional(),
        createdBefore: z.date().optional(),
        limit: z.number().int().min(1).max(100).optional().default(10),
        offset: z.number().int().min(0).optional().default(0),
        projectId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      const conditions = [eq(Traces.orgId, ctx.auth.orgId)];

      if (input.projectId) {
        conditions.push(eq(Traces.projectId, input.projectId));
      }
      if (input.createdAfter) {
        conditions.push(gte(Traces.createdAt, input.createdAfter));
      }
      if (input.createdBefore) {
        conditions.push(lte(Traces.createdAt, input.createdBefore));
      }

      const [traces, totalResult] = await Promise.all([
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
        traces,
      };
    }),

  sendTestTrace: protectedProcedure
    .input(
      z.object({
        apiKey: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get the API key to find the project ID
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      const apiKey = await db.query.ApiKeys.findFirst({
        where: and(
          eq(ApiKeys.key, input.apiKey),
          eq(ApiKeys.orgId, ctx.auth.orgId),
        ),
      });

      if (!apiKey) {
        throw new Error('Invalid API key');
      }

      const projectId = apiKey.projectId;
      const testTraceData = {
        llm_generation: {
          error: null,
          input: 'Hello, this is a test trace from Untrace!',
          input_tokens: 10,
          latency: 1250,
          max_tokens: 100,
          model: 'gpt-4',
          output_choices: [
            {
              message: {
                content: 'Hello! This is a test response from the AI model.',
                role: 'assistant',
              },
            },
          ],
          output_tokens: 15,
          provider: 'openai',
          span_name: 'test_generation',
          temperature: 0.7,
        },
      };

      const traceId = createId();
      const spanId = createId();

      const [trace] = await db
        .insert(Traces)
        .values({
          data: testTraceData,
          expiresAt: addDays(new Date(), 30),
          id: createId(),
          orgId: ctx.auth.orgId,
          projectId: projectId,
          spanId,
          traceId,
          userId: ctx.auth.userId || null,
        })
        .returning();

      if (!trace) {
        throw new Error('Failed to create test trace');
      }

      return trace;
    }),
});
