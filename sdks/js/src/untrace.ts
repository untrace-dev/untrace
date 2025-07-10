import {
  DiagConsoleLogger,
  DiagLogLevel,
  diag,
  trace,
} from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { UntraceContext } from './context';
import { UntraceExporter } from './exporter';
import { UntraceMetricsImpl } from './metrics';
import { getProviderInstrumentation } from './providers';
import { UntraceTracer } from './tracer';
import type { ProviderInstrumentation, UntraceConfig } from './types';

// Define deployment environment attribute since it's not in stable exports
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment' as const;

let instance: Untrace | null = null;

/**
 * Main Untrace SDK class
 */
export class Untrace {
  private provider: NodeTracerProvider;
  private config: Required<UntraceConfig>;
  private tracer: UntraceTracer;
  private metrics: UntraceMetricsImpl;
  private context: UntraceContext;
  private instrumentations: ProviderInstrumentation[] = [];

  constructor(config: UntraceConfig) {
    // Set up config with defaults
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.untrace.dev',
      captureBody: config.captureBody !== false,
      captureErrors: config.captureErrors !== false,
      debug: config.debug || false,
      disableAutoInstrumentation: config.disableAutoInstrumentation || false,
      environment: config.environment || 'production',
      exportIntervalMs: config.exportIntervalMs || 5000,
      headers: config.headers || {},
      maxBatchSize: config.maxBatchSize || 512,
      providers: config.providers || ['all'],
      resourceAttributes: config.resourceAttributes || {},
      samplingRate: config.samplingRate || 1.0,
      serviceName: config.serviceName || 'untrace-app',
      spanProcessors: config.spanProcessors || [],
      version: config.version || '0.0.0',
    };

    // Enable debug logging if requested
    if (this.config.debug) {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }

    // Create resource with service information
    const resource = Resource.default().merge(
      new Resource({
        [ATTR_SERVICE_NAME]: this.config.serviceName,
        [ATTR_SERVICE_VERSION]: this.config.version,
        [ATTR_DEPLOYMENT_ENVIRONMENT]: this.config.environment,
        ...this.config.resourceAttributes,
      }),
    );

    // Create tracer provider
    this.provider = new NodeTracerProvider({
      resource,
      sampler: {
        shouldSample: () => ({
          attributes: {},
          decision: Math.random() < this.config.samplingRate ? 1 : 0,
        }),
        toString: () => 'UntraceSampler',
      },
    });

    // Create and add exporter
    const exporter = new UntraceExporter(this.config);
    const spanProcessor = new BatchSpanProcessor(exporter, {
      maxExportBatchSize: this.config.maxBatchSize,
      maxQueueSize: this.config.maxBatchSize,
      scheduledDelayMillis: this.config.exportIntervalMs,
    });
    this.provider.addSpanProcessor(spanProcessor);

    // Add any custom span processors
    this.config.spanProcessors.forEach((processor) => {
      this.provider.addSpanProcessor(processor as SpanProcessor);
    });

    // Register as global tracer provider
    this.provider.register();

    // Initialize components
    this.tracer = new UntraceTracer(
      trace.getTracer(this.config.serviceName, this.config.version),
    );
    this.metrics = new UntraceMetricsImpl();
    this.context = new UntraceContext();

    // Auto-instrument if not disabled
    if (!this.config.disableAutoInstrumentation) {
      this.autoInstrument();
    }

    // Store instance
    instance = this;
  }

  /**
   * Auto-instrument supported providers
   */
  private autoInstrument(): void {
    const providers = this.config.providers;
    const instrumentations: ProviderInstrumentation[] = [];

    // Default providers if not specified
    const defaultProviders = [
      'openai',
      // TODO: Add these as they are implemented
      // 'anthropic',
      // 'ai-sdk',
      // 'cohere',
      // 'langchain',
      // 'llamaindex',
      // 'bedrock',
      // 'vertex-ai',
      // 'mistral',
    ];

    const providersToInstrument = providers.includes('all')
      ? defaultProviders
      : providers.filter((p) => defaultProviders.includes(p));

    providersToInstrument.forEach((providerName) => {
      try {
        const instrumentation = getProviderInstrumentation(providerName);
        if (instrumentation) {
          instrumentation.init(this.config);
          instrumentations.push(instrumentation);
        }
      } catch (error) {
        if (this.config.debug) {
          console.warn(
            `Failed to load instrumentation for ${providerName}:`,
            error,
          );
        }
      }
    });

    // Register all instrumentations
    if (instrumentations.length > 0) {
      // TODO: Refactor ProviderInstrumentation to extend from @opentelemetry/instrumentation's Instrumentation class
      // For now, auto-instrumentation is disabled. Use manual instrumentation via untrace.instrument() method.
      // registerInstrumentations({
      //   instrumentations: instrumentations,
      // });
      this.instrumentations = instrumentations;
    }
  }

  /**
   * Get the tracer instance
   */
  getTracer(): UntraceTracer {
    return this.tracer;
  }

  /**
   * Get the metrics instance
   */
  getMetrics(): UntraceMetricsImpl {
    return this.metrics;
  }

  /**
   * Get the context instance
   */
  getContext(): UntraceContext {
    return this.context;
  }

  /**
   * Manually instrument a provider
   */
  instrument<T>(providerName: string, module: T): T {
    const instrumentation = getProviderInstrumentation(providerName);
    if (!instrumentation) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    if (!instrumentation.canInstrument(module)) {
      throw new Error(
        `Module is not instrumentable by ${providerName} provider`,
      );
    }

    instrumentation.init(this.config);
    return instrumentation.instrument(module);
  }

  /**
   * Flush all pending spans
   */
  async flush(): Promise<void> {
    await this.provider.forceFlush();
  }

  /**
   * Shutdown the SDK
   */
  async shutdown(): Promise<void> {
    // Disable all instrumentations
    this.instrumentations.forEach((inst) => {
      try {
        inst.disable();
      } catch (_error) {
        // Ignore errors during shutdown
      }
    });

    // Shutdown provider
    await this.provider.shutdown();

    // Clear instance
    if (instance === this) {
      instance = null;
    }
  }

  /**
   * Get the current Untrace instance
   */
  static getInstance(): Untrace | null {
    return instance;
  }
}

/**
 * Initialize the Untrace SDK
 */
export function init(config: UntraceConfig): Untrace {
  if (instance) {
    console.warn(
      'Untrace SDK already initialized. Returning existing instance.',
    );
    return instance;
  }

  return new Untrace(config);
}

/**
 * Get the current Untrace instance
 */
export function getUntrace(): Untrace {
  if (!instance) {
    throw new Error('Untrace SDK not initialized. Call init() first.');
  }
  return instance;
}
