import { and, desc, eq, gte, lt, lte } from 'drizzle-orm';
import { db } from './client';
import {
  OrgDestinations,
  type OrgDestinationType,
  TraceDeliveries,
  Traces,
  type TraceType,
} from './schema';

// Interface for delivery adapters
export interface ITraceDeliveryAdapter {
  deliver(
    trace: TraceType,
    config: any,
    transformedPayload?: any,
  ): Promise<{
    success: boolean;
    responseData?: any;
    error?: string;
  }>;
}

// Example adapter implementations
export class LangfuseAdapter implements ITraceDeliveryAdapter {
  async deliver(trace: TraceType, config: any, transformedPayload?: any) {
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
  async deliver(trace: TraceType, config: any, transformedPayload?: any) {
    const payload = transformedPayload || trace.data;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.timeout || 30000,
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
export class TransformService {
  static execute(
    transformFunction: string,
    trace: TraceType,
    destination: OrgDestinationType,
  ): any {
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
              orderBy: [desc(OrgDestinations.priority)],
              where: and(
                eq(OrgDestinations.isActive, true),
                // Optional: Add filtering support
              ),
              with: {
                provider: true,
              },
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
        const existing = await db.query.TraceDeliveries.findFirst({
          where: and(
            eq(TraceDeliveries.traceId, traceId),
            eq(TraceDeliveries.destinationId, destination.id),
          ),
        });

        if (existing) {
          return existing;
        }

        // Create new delivery record
        const [delivery] = await db
          .insert(TraceDeliveries)
          .values({
            destinationId: destination.id,
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
    const delivery = await db.query.TraceDeliveries.findFirst({
      where: eq(TraceDeliveries.id, deliveryId),
      with: {
        destination: {
          with: {
            provider: true,
          },
        },
        trace: true,
      },
    });

    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    // Check if we should retry
    if (
      delivery.status === 'failed' &&
      delivery.destination.retryEnabled &&
      delivery.attempts >= delivery.destination.maxRetries
    ) {
      await this.markDeliveryFailed(deliveryId, 'Max retries exceeded');
      return;
    }

    // Apply rate limiting
    if (delivery.destination.rateLimit) {
      // Check rate limits
      const recentDeliveries = await db.query.TraceDeliveries.findMany({
        where: and(
          eq(TraceDeliveries.destinationId, delivery.destinationId),
          eq(TraceDeliveries.status, 'delivered'),
          gte(TraceDeliveries.lastAttemptAt, new Date(Date.now() - 60000)), // Last minute
        ),
      });

      if (recentDeliveries.length >= delivery.destination.rateLimit) {
        // Schedule for later
        await this.scheduleRetry(deliveryId, 60000); // Retry in 1 minute
        return;
      }
    }

    // Transform the payload if needed
    let transformedPayload = delivery.trace.data;
    if (delivery.destination.transformFunction) {
      transformedPayload = TransformService.execute(
        delivery.destination.transformFunction,
        delivery.trace,
        delivery.destination,
      );
    }

    // Get the adapter
    const adapter = adapterRegistry[delivery.destination.provider.type];
    if (!adapter) {
      await this.markDeliveryFailed(
        deliveryId,
        `No adapter found for provider type: ${delivery.destination.provider.type}`,
      );
      return;
    }

    // Decrypt config (implement your encryption logic)
    const config = await this.decryptConfig(delivery.destination.config);

    // Attempt delivery
    const result = await adapter.deliver(
      delivery.trace,
      config,
      transformedPayload,
    );

    if (result.success) {
      await db
        .update(TraceDeliveries)
        .set({
          deliveredAt: new Date(),
          responseData: result.responseData,
          status: 'success',
          transformedPayload,
          updatedAt: new Date(),
        })
        .where(eq(TraceDeliveries.id, deliveryId));
    } else {
      const attempts = delivery.attempts + 1;

      if (
        delivery.destination.retryEnabled &&
        attempts < delivery.destination.maxRetries
      ) {
        // Calculate next retry with exponential backoff
        const delayMs = Math.min(
          delivery.destination.retryDelayMs * 2 ** (attempts - 1),
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
      .update(TraceDeliveries)
      .set({
        attempts: TraceDeliveries.attempts + 1,
        lastError: error,
        lastErrorAt: new Date(),
        nextRetryAt,
        status: 'retrying',
        updatedAt: new Date(),
      })
      .where(eq(TraceDeliveries.id, deliveryId));
  }

  private async markDeliveryFailed(deliveryId: string, error: string) {
    await db
      .update(TraceDeliveries)
      .set({
        lastError: error,
        lastErrorAt: new Date(),
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(TraceDeliveries.id, deliveryId));
  }

  private async decryptConfig(encryptedConfig: any): Promise<any> {
    // TODO: Implement your decryption logic
    // This is a placeholder - in production, use proper encryption
    return encryptedConfig;
  }

  // Background job to process retries
  async processRetries(): Promise<void> {
    const retriesToProcess = await db.query.TraceDeliveries.findMany({
      limit: 100,
      where: and(
        eq(TraceDeliveries.status, 'pending'),
        lte(TraceDeliveries.nextRetryAt, new Date()),
        lt(TraceDeliveries.attempts, 5), // Max 5 attempts
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
export async function handleTraceIngestion(
  traceData: unknown,
  orgId: string,
  userId?: string,
) {
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
      spanId: traceData.spanId,
      traceId: traceData.traceId || crypto.randomUUID(),
      userId,
    })
    .returning();

  // Process deliveries asynchronously
  const service = new TraceDeliveryService();

  // Don't await - process in background
  service.processNewTrace(trace.id).catch((error) => {
    console.error('Failed to process trace deliveries:', error);
  });

  return trace;
}
