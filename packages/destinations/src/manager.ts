import { LangfuseIntegration } from './langfuse';
import { PostHogIntegration } from './posthog';
import type {
  IntegrationProvider,
  IntegrationsConfig,
  TraceContext,
  TraceData,
} from './types';
import { WebhookIntegration } from './webhook';

export class IntegrationsManager {
  private providers: Map<string, IntegrationProvider> = new Map();
  private config: IntegrationsConfig;

  constructor(config: IntegrationsConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize PostHog
    if (this.config.posthog?.enabled) {
      this.providers.set(
        'posthog',
        new PostHogIntegration(this.config.posthog),
      );
    }

    // Initialize Langfuse
    if (this.config.langfuse?.enabled) {
      this.providers.set(
        'langfuse',
        new LangfuseIntegration(this.config.langfuse),
      );
    }

    // Initialize Webhook
    if (this.config.webhook?.enabled) {
      this.providers.set(
        'webhook',
        new WebhookIntegration(this.config.webhook),
      );
    }

    // TODO: Initialize other providers
    // if (this.config.datadog?.enabled) {
    //   this.providers.set('datadog', new DatadogIntegration(this.config.datadog));
    // }

    // if (this.config.s3?.enabled) {
    //   this.providers.set('s3', new S3Integration(this.config.s3));
    // }
  }

  /**
   * Capture a trace event across all enabled providers
   */
  async captureTrace(trace: TraceData): Promise<void> {
    const promises = Array.from(this.providers.values())
      .filter((provider) => provider.isEnabled())
      .map((provider) => provider.captureTrace(trace));

    await Promise.allSettled(promises);
  }

  /**
   * Capture an error event across all enabled providers
   */
  async captureError(error: Error, trace: TraceData): Promise<void> {
    const promises = Array.from(this.providers.values())
      .filter((provider) => provider.isEnabled())
      .map((provider) => provider.captureError(error, trace));

    await Promise.allSettled(promises);
  }

  /**
   * Identify a user across all enabled providers
   */
  async identifyUser(
    distinctId: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    const promises = Array.from(this.providers.values())
      .filter((provider) => provider.isEnabled())
      .map((provider) => provider.identifyUser(distinctId, properties));

    await Promise.allSettled(promises);
  }

  /**
   * Flush all pending events across all providers
   */
  async flush(): Promise<void> {
    const promises = Array.from(this.providers.values())
      .filter((provider) => provider.isEnabled() && provider.flush)
      .map((provider) => provider.flush?.());

    await Promise.allSettled(promises);
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): IntegrationProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all enabled providers
   */
  getEnabledProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values()).filter((provider) =>
      provider.isEnabled(),
    );
  }

  /**
   * Check if a specific provider is enabled
   */
  isProviderEnabled(name: string): boolean {
    const provider = this.providers.get(name);
    return provider?.isEnabled() || false;
  }

  /**
   * Create a trace context for grouping related events
   */
  createTraceContext(options: Partial<TraceContext> = {}): TraceContext {
    return {
      distinctId: options.distinctId,
      parentId: options.parentId,
      properties: options.properties || {},
      spanId: options.spanId,
      spanName: options.spanName,
      traceId:
        options.traceId ||
        `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Helper method to create a trace data object
   */
  createTraceData(
    traceId: string,
    data: Record<string, unknown>,
    orgId: string,
    options: {
      spanId?: string;
      parentSpanId?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
      createdAt?: Date;
      expiresAt?: Date;
    } = {},
  ): TraceData {
    return {
      createdAt: options.createdAt || new Date(),
      data,
      expiresAt:
        options.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      metadata: options.metadata,
      orgId,
      parentSpanId: options.parentSpanId,
      spanId: options.spanId,
      traceId,
      userId: options.userId,
    };
  }
}
