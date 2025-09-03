/** biome-ignore-all lint/suspicious/noExplicitAny: todo */
import { and, desc, eq, gte, lt, lte } from 'drizzle-orm';
import { db } from './client';
import {
  Deliveries,
  Destinations,
  type DestinationType,
  Traces,
  type TraceType,
} from './schema';

// Interface for delivery adapters
export interface ITraceDeliveryAdapter {
  deliver(
    trace: TraceType,
    config: unknown,
    transformedPayload?: unknown,
  ): Promise<{
    success: boolean;
    responseData?: unknown;
    error?: string;
  }>;
}

// Example adapter implementations
export class LangfuseAdapter implements ITraceDeliveryAdapter {
  async deliver(trace: TraceType, config: any, transformedPayload?: unknown) {
    const payload = transformedPayload || trace.data;

    try {
      const response = await fetch(
        `${config.baseUrl}/api/public/ingestion/traces`,
        {
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            'X-Langfuse-Public-Key': config.publicKey,
            'X-Langfuse-Secret-Key': config.secretKey,
          },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return {
        responseData: await response.json(),
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }
}

export class WebhookAdapter implements ITraceDeliveryAdapter {
  async deliver(trace: TraceType, config: any, transformedPayload?: unknown) {
    const payload = transformedPayload || trace.data;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.timeoutMs || 30000,
      );

      const response = await fetch(config.url, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        method: config.method || 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return {
        responseData: await response.json().catch(() => ({ status: 'ok' })),
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }
}

// Registry of adapters
const adapterRegistry: Record<string, ITraceDeliveryAdapter> = {
  langfuse: new LangfuseAdapter(),
  webhook: new WebhookAdapter(),
  // Add more adapters as needed
};

// Transform execution service (should be sandboxed in production)
// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class TransformService {
  static execute(
    transformFunction: string,
    trace: TraceType,
    destination: DestinationType,
  ): unknown {
    try {
      // WARNING: This is a simple example. In production, use a proper sandbox
      // like vm2, isolated-vm, or a separate worker process
      const func = new Function('trace', 'destination', transformFunction);
      return func(trace, destination);
    } catch (error) {
      console.error('Transform execution failed:', error);
      // Return original trace data if transform fails
      return trace.data;
    }
  }
}

// Main delivery service
export class TraceDeliveryService {
  async processNewTrace(traceId: string): Promise<void> {
    // Get trace with organization and destinations
    const trace = await db.query.Traces.findFirst({
      where: eq(Traces.id, traceId),
      with: {
        org: {
          with: {
            destinations: {
              orderBy: [desc(Destinations.batchSize)],
              where: and(
                eq(Destinations.isEnabled, true),
                // Optional: Add filtering support
              ),
            },
          },
        },
      },
    });

    if (!trace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    // Create delivery records for each active destination
    const deliveries = await Promise.all(
      trace.org.destinations.map(async (destination: any) => {
        // Check if delivery already exists
        const existing = await db.query.Deliveries.findFirst({
          where: and(
            eq(Deliveries.traceId, traceId),
            eq(Deliveries.destinationId, destination.id),
          ),
        });

        if (existing) {
          return existing;
        }

        // Create new delivery record
        const [delivery] = await db
          .insert(Deliveries)
          .values({
            destinationId: destination.id,
            projectId: destination.projectId,
            status: 'pending',
            traceId,
          })
          .returning();

        return delivery;
      }),
    );

    // Process all deliveries
    await Promise.all(
      deliveries.map((delivery: any) => this.processDelivery(delivery.id)),
    );
  }

  async processDelivery(deliveryId: string): Promise<void> {
    const delivery = await db.query.Deliveries.findFirst({
      where: eq(Deliveries.id, deliveryId),
      with: {
        trace: true,
      },
    });

    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    // Get the destination separately
    const destination = await db.query.Destinations.findFirst({
      where: eq(Destinations.id, delivery.destinationId),
    });

    if (!destination) {
      throw new Error(`Destination ${delivery.destinationId} not found`);
    }

    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    // Check if we should retry
    if (
      delivery.status === 'failed' &&
      destination.retryEnabled &&
      delivery.attempts >= destination.maxRetries
    ) {
      await this.markDeliveryFailed(deliveryId, 'Max retries exceeded');
      return;
    }

    // Apply rate limiting
    if (destination.rateLimit) {
      // Check rate limits
      const recentDeliveries = await db.query.Deliveries.findMany({
        where: and(
          eq(Deliveries.destinationId, delivery.destinationId),
          eq(Deliveries.status, 'success'),
          gte(Deliveries.deliveredAt, new Date(Date.now() - 60000)), // Last minute
        ),
      });

      if (recentDeliveries.length >= destination.rateLimit) {
        // Schedule for later
        await this.scheduleRetry(deliveryId, 60000); // Retry in 1 minute
        return;
      }
    }

    // Transform the payload if needed
    let transformedPayload = delivery.trace.data;
    if (destination.transformFunction) {
      transformedPayload = TransformService.execute(
        destination.transformFunction,
        delivery.trace,
        destination,
      );
    }

    // Get the adapter
    const adapter = adapterRegistry[destination.destinationId];
    if (!adapter) {
      await this.markDeliveryFailed(
        deliveryId,
        `No adapter found for provider type: ${destination.destinationId}`,
      );
      return;
    }

    // Decrypt config (implement your encryption logic)
    const config = await this.decryptConfig(destination.config);

    // Attempt delivery
    const result = await adapter.deliver(
      delivery.trace,
      config,
      transformedPayload,
    );

    if (result.success) {
      await db
        .update(Deliveries)
        .set({
          deliveredAt: new Date(),
          responseData: result.responseData,
          status: 'success',
          transformedPayload,
          updatedAt: new Date(),
        })
        .where(eq(Deliveries.id, deliveryId));
    } else {
      const attempts = delivery.attempts + 1;

      if (destination.retryEnabled && attempts < destination.maxRetries) {
        // Calculate next retry with exponential backoff
        const delayMs = Math.min(
          destination.retryDelayMs * 2 ** (attempts - 1),
          300000, // Max 5 minutes
        );

        await this.scheduleRetry(deliveryId, delayMs, result.error);
      } else {
        await this.markDeliveryFailed(
          deliveryId,
          result.error || 'Unknown error',
        );
      }
    }
  }

  private async scheduleRetry(
    deliveryId: string,
    delayMs: number,
    error?: string,
  ) {
    const nextRetryAt = new Date(Date.now() + delayMs);

    await db
      .update(Deliveries)
      .set({
        attempts: (Deliveries.attempts as any) + 1,
        lastError: error,
        lastErrorAt: new Date(),
        nextRetryAt,
        status: 'retrying',
        updatedAt: new Date(),
      })
      .where(eq(Deliveries.id, deliveryId));
  }

  private async markDeliveryFailed(deliveryId: string, error: string) {
    await db
      .update(Deliveries)
      .set({
        lastError: error,
        lastErrorAt: new Date(),
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(Deliveries.id, deliveryId));
  }

  private async decryptConfig(encryptedConfig: unknown): Promise<unknown> {
    // TODO: Implement your decryption logic
    // This is a placeholder - in production, use proper encryption
    return encryptedConfig;
  }

  // Background job to process retries
  async processRetries(): Promise<void> {
    const retriesToProcess = await db.query.Deliveries.findMany({
      limit: 100,
      where: and(
        eq(Deliveries.status, 'pending'),
        lte(Deliveries.nextRetryAt, new Date()),
        lt(Deliveries.attempts, 5), // Max 5 attempts
      ),
    });

    await Promise.all(
      retriesToProcess.map((delivery: any) =>
        this.processDelivery(delivery.id),
      ),
    );
  }

  // Background job to clean up expired traces
  async cleanupExpiredTraces() {
    const deleted = await db
      .delete(Traces)
      .where(lt(Traces.expiresAt, new Date()))
      .returning({ id: Traces.id });

    console.log(`Deleted ${deleted.length} expired traces`);
  }
}

// Example usage
async function _main() {
  const service = new TraceDeliveryService();

  // Process a new trace
  await service.processNewTrace('tr_123456');

  // Run background jobs (typically in a cron job or scheduled task)
  setInterval(() => service.processRetries(), 60000); // Every minute
  setInterval(() => service.cleanupExpiredTraces(), 3600000); // Every hour
}

// Webhook endpoint example for receiving traces
export async function handleTraceIngestion({
  traceData,
  orgId,
  userId,
  projectId,
}: {
  traceData: any;
  orgId: string;
  userId?: string;
  projectId: string;
}) {
  // Store the trace
  const [trace] = await db
    .insert(Traces)
    .values({
      data: traceData,
      metadata: {
        source: 'api',
        version: '1.0',
      },
      orgId,
      parentSpanId: traceData.parentSpanId,
      projectId,
      spanId: traceData.spanId,
      traceId: traceData.traceId || crypto.randomUUID(),
      userId,
    })
    .returning();

  // Process deliveries asynchronously
  const service = new TraceDeliveryService();

  if (!trace) {
    throw new Error('Failed to store trace');
  }

  // Don't await - process in background
  service.processNewTrace(trace.id).catch((error) => {
    console.error('Failed to process trace deliveries:', error);
  });

  return trace;
}
