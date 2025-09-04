import { db } from '@untrace/db/client';
import {
  ApiKeys,
  Destinations,
  type TraceInsertType,
  Traces,
} from '@untrace/db/schema';
import { eq } from 'drizzle-orm';
import { createTraceDeliveryService } from './database-adapter';

export interface FanoutContext {
  apiKeyId?: string;
  orgId: string;
  projectId: string;
  userId?: string;
}

export interface FanoutResult {
  success: boolean;
  tracesProcessed: number;
  destinationsProcessed: number;
  errors: Array<{
    destinationId: string;
    error: string;
  }>;
}

export interface TraceDeliveryJob {
  traceId: string;
  orgId: string;
  projectId: string;
  apiKeyId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class TraceFanoutService {
  private deliveryService = createTraceDeliveryService();

  /**
   * Process a single trace through all enabled destinations for the org/project
   */
  async processTrace(
    trace: TraceInsertType,
    context: FanoutContext,
  ): Promise<FanoutResult> {
    const errors: Array<{ destinationId: string; error: string }> = [];
    let destinationsProcessed = 0;

    try {
      // Get all enabled destinations for the org/project
      const destinations = await this.getDestinationsForContext(context);

      if (destinations.length === 0) {
        return {
          destinationsProcessed: 0,
          errors: [],
          success: true,
          tracesProcessed: 1,
        };
      }

      // Process trace through each destination
      await Promise.all(
        destinations.map(async (destination) => {
          try {
            await this.deliveryService.processTrace(
              this.convertTraceDataToDatabaseTrace(trace, context),
              [destination],
            );
            destinationsProcessed++;
          } catch (error) {
            errors.push({
              destinationId: destination.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }),
      );

      return {
        destinationsProcessed,
        errors,
        success: errors.length === 0,
        tracesProcessed: 1,
      };
    } catch (error) {
      return {
        destinationsProcessed: 0,
        errors: [
          {
            destinationId: 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        success: false,
        tracesProcessed: 1,
      };
    }
  }

  /**
   * Process multiple traces through all enabled destinations
   */
  async processTraces(
    traces: TraceInsertType[],
    context: FanoutContext,
  ): Promise<FanoutResult> {
    const errors: Array<{ destinationId: string; error: string }> = [];
    let destinationsProcessed = 0;

    try {
      // Get all enabled destinations for the org/project
      const destinations = await this.getDestinationsForContext(context);

      if (destinations.length === 0) {
        return {
          destinationsProcessed: 0,
          errors: [],
          success: true,
          tracesProcessed: traces.length,
        };
      }

      // Process each trace through each destination
      for (const trace of traces) {
        for (const destination of destinations) {
          try {
            await this.deliveryService.processTrace(
              this.convertTraceDataToDatabaseTrace(trace, context),
              [destination],
            );
            destinationsProcessed++;
          } catch (error) {
            errors.push({
              destinationId: destination.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      return {
        destinationsProcessed,
        errors,
        success: errors.length === 0,
        tracesProcessed: traces.length,
      };
    } catch (error) {
      return {
        destinationsProcessed: 0,
        errors: [
          {
            destinationId: 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        success: false,
        tracesProcessed: traces.length,
      };
    }
  }

  /**
   * Process a trace delivery job (for queue-based processing)
   */
  async processTraceDeliveryJob(job: TraceDeliveryJob): Promise<FanoutResult> {
    try {
      // Get the trace from the database
      const trace = await db.query.Traces.findFirst({
        where: eq(Traces.id, job.traceId),
      });

      if (!trace) {
        return {
          destinationsProcessed: 0,
          errors: [
            {
              destinationId: 'unknown',
              error: `Trace not found: ${job.traceId}`,
            },
          ],
          success: false,
          tracesProcessed: 0,
        };
      }

      // Convert to TraceData format
      const traceData =
        this.deliveryService.convertDatabaseTraceToTraceData(trace);

      // Process through all destinations
      return await this.processTrace(traceData, {
        apiKeyId: job.apiKeyId,
        orgId: job.orgId,
        projectId: job.projectId,
        userId: job.userId,
      });
    } catch (error) {
      return {
        destinationsProcessed: 0,
        errors: [
          {
            destinationId: 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        success: false,
        tracesProcessed: 0,
      };
    }
  }

  /**
   * Get all enabled destinations for a given context
   */
  private async getDestinationsForContext(context: FanoutContext) {
    const { orgId, projectId } = context;

    // Get destinations for the org/project
    const destinations = await db.query.Destinations.findMany({
      where: eq(Destinations.orgId, orgId),
    });

    // Filter by project if specified
    return destinations.filter(
      (dest) => dest.projectId === projectId && dest.isEnabled,
    );
  }

  /**
   * Convert TraceData to database trace format
   */
  private convertTraceDataToDatabaseTrace(
    trace: TraceInsertType,
    context: FanoutContext,
  ) {
    return {
      apiKeyId: context.apiKeyId || null,
      createdAt: trace.createdAt || new Date(),
      data: trace.data,
      expiresAt:
        trace.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      id: trace.traceId, // Use traceId as id for now
      metadata: trace.metadata || null,
      orgId: context.orgId,
      parentSpanId: trace.parentSpanId || null,
      projectId: context.projectId,
      spanId: trace.spanId || null,
      traceId: trace.traceId,
      updatedAt: new Date(),
      userId: context.userId || null,
    };
  }

  /**
   * Get API key context from API key ID
   */
  async getContextFromApiKey(apiKeyId: string): Promise<FanoutContext | null> {
    try {
      const apiKey = await db.query.ApiKeys.findFirst({
        where: eq(ApiKeys.id, apiKeyId),
        with: {
          org: true,
          project: true,
          user: true,
        },
      });

      if (!apiKey) {
        return null;
      }

      return {
        apiKeyId: apiKey.id,
        orgId: apiKey.orgId,
        projectId: apiKey.projectId,
        userId: apiKey.userId,
      };
    } catch (error) {
      console.error('Error getting context from API key:', error);
      return null;
    }
  }

  /**
   * Get API key context from API key string
   */
  async getContextFromApiKeyString(
    apiKeyString: string,
  ): Promise<FanoutContext | null> {
    try {
      const apiKey = await db.query.ApiKeys.findFirst({
        where: eq(ApiKeys.key, apiKeyString),
        with: {
          org: true,
          project: true,
          user: true,
        },
      });

      if (!apiKey) {
        return null;
      }

      return {
        apiKeyId: apiKey.id,
        orgId: apiKey.orgId,
        projectId: apiKey.projectId,
        userId: apiKey.userId,
      };
    } catch (error) {
      console.error('Error getting context from API key string:', error);
      return null;
    }
  }

  /**
   * Create a trace delivery job for queue processing
   */
  createTraceDeliveryJob(
    trace: TraceInsertType,
    context: FanoutContext,
  ): TraceDeliveryJob {
    return {
      apiKeyId: context.apiKeyId,
      metadata: trace.metadata as Record<string, unknown> | undefined,
      orgId: context.orgId,
      projectId: context.projectId,
      traceId: trace.traceId,
      userId: context.userId,
    };
  }
}

// Factory function to create the fanout service
export function createTraceFanoutService(): TraceFanoutService {
  return new TraceFanoutService();
}
