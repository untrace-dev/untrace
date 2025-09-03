// Import database types from your schema
import type {
  DeliveryType,
  DestinationType,
  TraceType,
} from '@untrace/db/schema';
import { LangfuseIntegration } from './langfuse';
import { IntegrationsManager } from './manager';
import { PostHogIntegration } from './posthog';
import type { IntegrationProvider, TraceData } from './types';
import { WebhookIntegration } from './webhook';

export interface TraceDeliveryService {
  /**
   * Process a trace and deliver it to all configured destinations for the org
   */
  processTrace(
    trace: TraceType,
    orgDestinations: DestinationType[],
  ): Promise<void>;

  /**
   * Process batch delivery for destinations that support it
   */
  processBatchDelivery(
    traces: TraceType[],
    destination: DestinationType,
  ): Promise<void>;

  /**
   * Create integration providers from org destinations
   */
  createProvidersFromDestinations(
    destinations: DestinationType[],
  ): IntegrationProvider[];

  /**
   * Convert database trace to our trace format
   */
  convertDatabaseTraceToTraceData(trace: TraceType): TraceData;

  /**
   * Get delivery status for a trace
   */
  getDeliveryStatus(
    traceId: string,
    destinationId: string,
  ): Promise<DeliveryType | null>;
}

export class DatabaseTraceDeliveryService implements TraceDeliveryService {
  private integrationsManager: IntegrationsManager | null = null;

  /**
   * Process a trace and deliver it to all configured destinations for the org
   */
  async processTrace(
    trace: TraceType,
    orgDestinations: DestinationType[],
  ): Promise<void> {
    // Create integration providers from destinations
    const providers = this.createProvidersFromDestinations(orgDestinations);

    if (providers.length === 0) {
      console.log('No enabled providers found for org destinations');
      return;
    }

    // Initialize integrations manager with the providers
    this.integrationsManager = new IntegrationsManager({});

    // Add providers to the manager
    for (const provider of providers) {
      (
        this.integrationsManager as unknown as {
          providers: Map<string, IntegrationProvider>;
        }
      ).providers.set(provider.name, provider);
    }

    // Convert database trace to our trace format
    const traceData = this.convertDatabaseTraceToTraceData(trace);

    // Capture the event across all enabled providers
    await this.integrationsManager.captureTrace(traceData);
  }

  /**
   * Create integration providers from org destinations
   */
  createProvidersFromDestinations(
    destinations: DestinationType[],
  ): IntegrationProvider[] {
    const providers: IntegrationProvider[] = [];

    for (const destination of destinations) {
      if (!destination.isEnabled) continue;

      const config = destination.config as Record<string, unknown>;

      switch (destination.destinationId) {
        case 'posthog':
          providers.push(
            new PostHogIntegration({
              apiKey: config.apiKey as string,
              enabled: true,
              endpoint: config.host as string,
              options: config.options as Record<string, unknown>,
            }),
          );
          break;

        case 'webhook':
          providers.push(
            new WebhookIntegration({
              apiKey: config.apiKey as string,
              enabled: true,
              endpoint: config.url as string,
              options: config.options as Record<string, unknown>,
            }),
          );
          break;

        case 'langfuse':
          providers.push(
            new LangfuseIntegration({
              apiKey:
                config.publicKey && config.secretKey
                  ? `${config.publicKey}:${config.secretKey}`
                  : (config.apiKey as string),
              enabled: true,
              endpoint: config.baseUrl as string,
              options: config.options as Record<string, unknown>,
            }),
          );
          break;

        // Add more providers as needed
        case 'datadog':
        case 's3':
        case 'openai':
        case 'langsmith':
        case 'keywords_ai':
        case 'new_relic':
        case 'grafana':
        case 'prometheus':
        case 'elasticsearch':
        case 'custom':
          // TODO: Implement these providers
          console.warn(
            `Provider ${destination.destinationId} not yet implemented`,
          );
          break;

        default:
          console.warn(`Unknown provider: ${destination.destinationId}`);
      }
    }

    return providers;
  }

  /**
   * Convert database trace to our trace format
   */
  convertDatabaseTraceToTraceData(trace: TraceType): TraceData {
    return {
      createdAt: trace.createdAt,
      data: trace.data as Record<string, unknown>,
      expiresAt: trace.expiresAt,
      metadata: trace.metadata as Record<string, unknown>,
      orgId: trace.orgId,
      parentSpanId: trace.parentSpanId || undefined,
      spanId: trace.spanId || undefined,
      traceId: trace.traceId,
      userId: trace.userId || undefined,
    };
  }

  /**
   * Get delivery status for a trace
   */
  async getDeliveryStatus(
    _traceId: string,
    _destinationId: string,
  ): Promise<DeliveryType | null> {
    // This would typically query your database
    // For now, return null as this is just a placeholder
    return null;
  }

  /**
   * Apply custom transform function to trace data
   */
  applyCustomTransform(
    trace: TraceType,
    destination: DestinationType,
  ): Record<string, unknown> {
    if (!destination.transformFunction) {
      return trace.data as Record<string, unknown>;
    }

    try {
      // Create a safe execution context for the transform function
      const transformFn = new Function(
        'trace',
        'destination',
        destination.transformFunction,
      );
      return transformFn(trace, destination);
    } catch (error) {
      console.error('Error applying custom transform:', error);
      return trace.data as Record<string, unknown>;
    }
  }

  /**
   * Handle batch delivery for destinations that support it
   */
  async processBatchDelivery(
    traces: TraceType[],
    destination: DestinationType,
  ): Promise<void> {
    // For now, process individually since supportsBatchDelivery is not in the schema
    for (const trace of traces) {
      await this.processTrace(trace, [destination]);
    }
  }
}

// Factory function to create the service
export function createTraceDeliveryService(): TraceDeliveryService {
  return new DatabaseTraceDeliveryService();
}
