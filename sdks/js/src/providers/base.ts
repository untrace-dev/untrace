import type { Instrumentation } from '@opentelemetry/instrumentation';
import type { ProviderInstrumentation, UntraceConfig } from '../types';

/**
 * Base class for provider instrumentations
 */
export abstract class BaseProviderInstrumentation
  implements ProviderInstrumentation
{
  protected config?: UntraceConfig;
  protected instrumentation?: Instrumentation;

  abstract readonly name: string;

  /**
   * Initialize the instrumentation
   */
  init(config: UntraceConfig): void {
    this.config = config;
  }

  /**
   * Check if a module is instrumentable
   */
  abstract canInstrument(module: unknown): boolean;

  /**
   * Instrument a module
   */
  abstract instrument<T = unknown>(module: T): T;

  /**
   * Disable instrumentation
   */
  disable(): void {
    if (this.instrumentation) {
      this.instrumentation.disable();
    }
  }

  /**
   * Check if debug mode is enabled
   */
  protected isDebugEnabled(): boolean {
    return this.config?.debug === true;
  }

  /**
   * Log debug message
   */
  protected debug(message: string, ...args: unknown[]): void {
    if (this.isDebugEnabled()) {
      console.debug(`[Untrace:${this.name}]`, message, ...args);
    }
  }
}
