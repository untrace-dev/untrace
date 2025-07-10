import { type Attributes, trace } from '@opentelemetry/api';
import { LLM_ATTRIBUTES } from './attributes';
import type { Cost, TokenUsage, UntraceMetrics } from './types';

/**
 * Metrics implementation for Untrace
 */
export class UntraceMetricsImpl implements UntraceMetrics {
  private readonly modelCosts: Map<string, { input: number; output: number }> =
    new Map([
      // OpenAI
      ['gpt-4', { input: 0.03, output: 0.06 }],
      ['gpt-4-32k', { input: 0.06, output: 0.12 }],
      ['gpt-3.5-turbo', { input: 0.0015, output: 0.002 }],
      ['gpt-3.5-turbo-16k', { input: 0.003, output: 0.004 }],
      // Anthropic
      ['claude-3-opus', { input: 0.015, output: 0.075 }],
      ['claude-3-sonnet', { input: 0.003, output: 0.015 }],
      ['claude-3-haiku', { input: 0.00025, output: 0.00125 }],
      ['claude-2.1', { input: 0.008, output: 0.024 }],
      ['claude-2', { input: 0.008, output: 0.024 }],
      ['claude-instant', { input: 0.0008, output: 0.0024 }],
      // Add more models as needed
    ]);

  /**
   * Record token usage
   */
  recordTokenUsage(usage: TokenUsage): void {
    const span = trace.getActiveSpan();
    if (!span) return;

    const attributes: Attributes = {
      [LLM_ATTRIBUTES.MODEL]: usage.model,
      [LLM_ATTRIBUTES.PROVIDER]: usage.provider,
    };

    if (usage.promptTokens !== undefined) {
      attributes[LLM_ATTRIBUTES.PROMPT_TOKENS] = usage.promptTokens;
    }
    if (usage.completionTokens !== undefined) {
      attributes[LLM_ATTRIBUTES.COMPLETION_TOKENS] = usage.completionTokens;
    }
    if (usage.totalTokens !== undefined) {
      attributes[LLM_ATTRIBUTES.TOTAL_TOKENS] = usage.totalTokens;
    } else if (
      usage.promptTokens !== undefined &&
      usage.completionTokens !== undefined
    ) {
      attributes[LLM_ATTRIBUTES.TOTAL_TOKENS] =
        usage.promptTokens + usage.completionTokens;
    }

    span.setAttributes(attributes);
    span.addEvent('llm.token_usage', attributes);
  }

  /**
   * Record latency
   */
  recordLatency(duration: number, attributes?: Attributes): void {
    const span = trace.getActiveSpan();
    if (!span) return;

    span.setAttribute(LLM_ATTRIBUTES.DURATION, duration);

    if (attributes) {
      span.setAttributes(attributes);
    }

    span.addEvent('llm.latency_recorded', {
      duration_ms: duration,
      ...attributes,
    });
  }

  /**
   * Record an error
   */
  recordError(error: Error, attributes?: Attributes): void {
    const span = trace.getActiveSpan();
    if (!span) return;

    span.recordException(error);
    span.setAttributes({
      [LLM_ATTRIBUTES.ERROR]: true,
      [LLM_ATTRIBUTES.ERROR_TYPE]: error.constructor.name,
      'error.message': error.message,
      ...attributes,
    });

    span.addEvent('llm.error_recorded', {
      'error.message': error.message,
      'error.stack': error.stack,
      'error.type': error.constructor.name,
      ...attributes,
    });
  }

  /**
   * Record cost
   */
  recordCost(cost: Cost, attributes?: Attributes): void {
    const span = trace.getActiveSpan();
    if (!span) return;

    const costAttributes: Attributes = {
      [LLM_ATTRIBUTES.MODEL]: cost.model,
      [LLM_ATTRIBUTES.PROVIDER]: cost.provider,
      [LLM_ATTRIBUTES.COST_TOTAL]: cost.total,
      'llm.cost.currency': cost.currency || 'USD',
      ...attributes,
    };

    if (cost.prompt !== undefined) {
      costAttributes[LLM_ATTRIBUTES.COST_PROMPT] = cost.prompt;
    }
    if (cost.completion !== undefined) {
      costAttributes[LLM_ATTRIBUTES.COST_COMPLETION] = cost.completion;
    }

    span.setAttributes(costAttributes);
    span.addEvent('llm.cost_recorded', costAttributes);
  }
}
