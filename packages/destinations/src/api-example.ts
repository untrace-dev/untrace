import type { DestinationType, TraceType } from '@untrace/db/schema';
import { createTraceDeliveryService } from './database-adapter';

// Example of how to integrate with your web app API endpoint
export class TraceDeliveryAPI {
  private deliveryService = createTraceDeliveryService();

  /**
   * Handle incoming trace from SDK
   */
  async handleTraceUpload(trace: TraceType, orgId: string): Promise<void> {
    try {
      // 1. Get org destinations from database
      const orgDestinations = await this.getOrgDestinations(orgId);

      if (orgDestinations.length === 0) {
        console.log(`No destinations configured for org ${orgId}`);
        return;
      }

      // 2. Process trace through all configured destinations
      await this.deliveryService.processTrace(trace, orgDestinations);

      console.log(`Successfully processed trace ${trace.id} for org ${orgId}`);
    } catch (error) {
      console.error('Error processing trace:', error);
      throw error;
    }
  }

  /**
   * Get org destinations from database
   */
  private async getOrgDestinations(orgId: string): Promise<DestinationType[]> {
    // This would be your actual database query
    // Example using your existing database client:

    // import { db } from '@untrace/db/client';
    // import { OrgDestinations } from '@untrace/db/schema';
    //
    // return await db
    //   .select()
    //   .from(OrgDestinations)
    //   .where(eq(OrgDestinations.orgId, orgId))
    //   .where(eq(OrgDestinations.isEnabled, true));

    // For now, return mock data
    return [
      {
        batchSize: 100,
        config: {
          apiKey: process.env.POSTHOG_API_KEY,
          endpoint: 'https://us.i.posthog.com',
        },
        createdAt: new Date(),
        description: null,
        destinationId: 'posthog_dest',
        id: 'dest_1',
        isEnabled: true,
        maxRetries: 3,
        name: 'PostHog Analytics',
        orgId,
        projectId: 'proj_1',
        rateLimit: 1000,
        retryDelayMs: 1000,
        retryEnabled: true,
        transformFunction: null,
        updatedAt: new Date(),
      },

      {
        batchSize: 100,
        config: {
          apiKey: process.env.WEBHOOK_API_KEY,
          endpoint: 'https://your-webhook.com/events',
        },
        createdAt: new Date(),
        description: null,
        destinationId: 'webhook_dest',
        id: 'dest_3',
        isEnabled: true,
        maxRetries: 3,
        name: 'Custom Webhook',
        orgId,
        projectId: 'proj_1',
        rateLimit: 1000,
        retryDelayMs: 1000,
        retryEnabled: true,
        transformFunction: `
          // Custom transform function
          return {
            ...trace.data,
            custom_field: 'transformed_value',
            org_id: destination.orgId,
            timestamp: new Date().toISOString()
          };
        `,
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Handle batch trace uploads
   */
  async handleBatchTraceUpload(
    traces: TraceType[],
    orgId: string,
  ): Promise<void> {
    const orgDestinations = await this.getOrgDestinations(orgId);

    // Process each destination individually for now
    for (const destination of orgDestinations) {
      await this.deliveryService.processBatchDelivery(traces, destination);
    }
  }

  /**
   * Get delivery status for a trace
   */
  async getTraceDeliveryStatus(
    _traceId: string,
    _destinationId: string,
  ): Promise<{
    status: string;
    attempts: number;
    lastError?: string;
    deliveredAt?: Date;
  } | null> {
    // This would query your TraceDeliveries table
    // For now, return mock data
    return {
      attempts: 1,
      deliveredAt: new Date(),
      status: 'success',
    };
  }
}

// Example usage in your API route handler
export async function handleTraceAPIEndpoint(
  request: Request,
): Promise<Response> {
  try {
    const traceData = (await request.json()) as TraceType;
    const orgId = request.headers.get('X-Org-ID');

    if (!orgId) {
      return new Response('Missing org ID', { status: 400 });
    }

    const api = new TraceDeliveryAPI();
    await api.handleTraceUpload(traceData, orgId);

    return new Response('Trace processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error in trace API endpoint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Example Next.js API route
export async function POST(request: Request): Promise<Response> {
  return handleTraceAPIEndpoint(request);
}
