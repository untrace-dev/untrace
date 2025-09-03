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
import { ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { UntraceContext } from './context';
import { UntraceExporter } from './exporter';
import { UntraceMetricsImpl } from './metrics';
import { getProviderInstrumentation } from './providers';
import { UntraceTracer } from './tracer';
import type { ProviderInstrumentation, UntraceConfig } from './types';

let instance: Untrace | null = null;
let isRegistered = false;

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
      baseUrl: config.baseUrl || 'https://untrace.dev',
      captureBody: config.captureBody !== false,
      captureErrors: config.captureErrors !== false,
      debug: config.debug || false,
      disableAutoInstrumentation: config.disableAutoInstrumentation || false,
      exportIntervalMs: config.exportIntervalMs || 5000,
      headers: config.headers || {},
      maxBatchSize: config.maxBatchSize || 512,
      providers: config.providers || ['all'],
      resourceAttributes: config.resourceAttributes || {},
      samplingRate: config.samplingRate || 1.0,
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
        [ATTR_SERVICE_VERSION]: this.config.version,
        ...this.config.resourceAttributes,
      }),
    );

    // Create and add exporter
    const exporter = new UntraceExporter(this.config);

    // Create batch span processor with configuration
    const batchSpanProcessor = new BatchSpanProcessor(exporter, {
      maxExportBatchSize: this.config.maxBatchSize,
      maxQueueSize: this.config.maxBatchSize,
      scheduledDelayMillis: this.config.exportIntervalMs,
    });

    // Combine all span processors
    const allSpanProcessors = [
      batchSpanProcessor,
      ...(this.config.spanProcessors as SpanProcessor[]),
    ];

    // Create tracer provider with span processors
    this.provider = new NodeTracerProvider({
      resource,
      sampler: {
        shouldSample: (
          _context,
          _traceId,
          spanName,
          _spanKind,
          _attributes,
          _links,
        ) => {
          const random = Math.random();
          const decision = random < this.config.samplingRate ? 1 : 0;
          if (this.config.debug) {
            console.log(
              `[UntraceSampler] Sampling span "${spanName}": random=${random}, rate=${this.config.samplingRate}, decision=${decision}`,
            );
          }
          return {
            attributes: {},
            decision,
          };
        },
        toString: () => 'UntraceSampler',
      },
      spanProcessors: allSpanProcessors,
    });

    // Register as global tracer provider only if not already registered
    if (!isRegistered) {
      try {
        this.provider.register();
        isRegistered = true;
      } catch (error) {
        // If registration fails, it might already be registered
        console.warn(
          'Tracer provider registration failed, might already be registered:',
          error,
        );
      }
    }

    // Initialize components
    this.tracer = new UntraceTracer(
      trace.getTracer('untrace-app', this.config.version),
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

    instrumentation.init(this.config, this.tracer.getTracer());
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
    isRegistered = false; // Reset registration flag on shutdown
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
