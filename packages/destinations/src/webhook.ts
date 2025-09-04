import type { TraceType } from '@untrace/db/schema';
import type {
  IntegrationConfig,
  IntegrationProvider,
  LLMGenerationEvent,
} from './types';

export class WebhookIntegration implements IntegrationProvider {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  get name(): string {
    return 'webhook';
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.endpoint;
  }

  async captureTrace(trace: TraceType): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      // Transform trace data to webhook format
      const eventData = this.transformTraceToWebhookFormat(trace);

      const payload = {
        data: eventData,
        event_type: 'llm_generation',
        timestamp: new Date().toISOString(),
        ...this.config.options,
      };

      if (!this.config.endpoint) {
        console.error('Webhook endpoint is not configured');
        return;
      }

      await fetch(this.config.endpoint, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
          ...(this.config.options?.headers as Record<string, string>),
        },
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to send webhook trace:', error);
    }
  }

  async captureError(error: Error, trace: TraceType): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      // Create error event with trace context
      const errorEvent: LLMGenerationEvent = {
        distinctId: trace.userId || undefined,
        error: error.message,
        input: [],
        inputTokens: 0,
        isError: true,
        model: 'unknown',
        outputChoices: [],
        outputTokens: 0,
        parentId: trace.parentSpanId || undefined,
        properties: {
          ...((trace.metadata as Record<string, unknown>) || {}),
          error_name: error.name,
          error_stack: error.stack,
          org_id: trace.orgId,
        },
        provider: 'unknown',
        spanId: trace.spanId || undefined,
        spanName: 'error',
        traceId: trace.traceId,
      };

      const payload = {
        data: errorEvent,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        event_type: 'llm_error',
        timestamp: new Date().toISOString(),
        ...this.config.options,
      };

      if (!this.config.endpoint) {
        console.error('Webhook endpoint is not configured');
        return;
      }

      await fetch(this.config.endpoint, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
          ...(this.config.options?.headers as Record<string, string>),
        },
        method: 'POST',
      });
    } catch (webhookError) {
      console.error('Failed to send webhook error:', webhookError);
    }
  }

  async identifyUser(
    distinctId: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const payload = {
        distinct_id: distinctId,
        event_type: 'user_identify',
        properties,
        timestamp: new Date().toISOString(),
        ...this.config.options,
      };

      if (!this.config.endpoint) {
        console.error('Webhook endpoint is not configured');
        return;
      }

      await fetch(this.config.endpoint, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
          ...(this.config.options?.headers as Record<string, string>),
        },
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to send webhook identify event:', error);
    }
  }

  /**
   * Transform trace data to webhook format
   */
  private transformTraceToWebhookFormat(trace: TraceType): LLMGenerationEvent {
    const traceData = trace.data as Record<string, unknown>;

    // If already in LLM generation format, extract it
    if (traceData.llm_generation) {
      const llmGen = traceData.llm_generation as LLMGenerationEvent;
      return {
        ...llmGen,
        distinctId: trace.userId || undefined,
        properties: {
          ...llmGen.properties,
          created_at: trace.createdAt,
          expires_at: trace.expiresAt,
          org_id: trace.orgId,
        },
      };
    }

    // Try to extract LLM-specific data from various formats
    const llmData = this.extractLLMDataFromTrace(traceData);

    return {
      baseUrl: llmData.baseUrl,
      cacheCreationInputTokens: llmData.cacheCreationInputTokens,
      cacheReadInputTokens: llmData.cacheReadInputTokens,
      distinctId: trace.userId || undefined,
      error: llmData.error,
      httpStatus: llmData.httpStatus,
      input: llmData.input || [],
      inputCostUsd: llmData.inputCostUsd,
      inputTokens: llmData.inputTokens || 0,
      isError: llmData.isError || false,
      latency: llmData.latency,
      maxTokens: llmData.maxTokens,
      model: llmData.model || 'unknown',
      outputChoices: llmData.outputChoices || [],
      outputCostUsd: llmData.outputCostUsd,
      outputTokens: llmData.outputTokens || 0,
      parentId: trace.parentSpanId || undefined,
      properties: {
        ...((trace.metadata as Record<string, unknown>) || {}),
        created_at: trace.createdAt,
        expires_at: trace.expiresAt,
        org_id: trace.orgId,
      },
      provider: llmData.provider || 'unknown',
      requestUrl: llmData.requestUrl,
      spanId: trace.spanId || undefined,
      spanName: llmData.spanName || 'llm_generation',
      stream: llmData.stream,
      temperature: llmData.temperature,
      tools: llmData.tools,
      totalCostUsd: llmData.totalCostUsd,
      traceId: trace.traceId,
    };
  }

  /**
   * Extract LLM-specific data from trace payload
   */
  private extractLLMDataFromTrace(traceData: Record<string, unknown>): {
    spanName?: string;
    model?: string;
    provider?: string;
    input?: LLMGenerationEvent['input'];
    inputTokens?: number;
    outputChoices?: LLMGenerationEvent['outputChoices'];
    outputTokens?: number;
    latency?: number;
    httpStatus?: number;
    baseUrl?: string;
    requestUrl?: string;
    isError?: boolean;
    error?: string | Record<string, unknown>;
    inputCostUsd?: number;
    outputCostUsd?: number;
    totalCostUsd?: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
    temperature?: number;
    stream?: boolean;
    maxTokens?: number;
    tools?: LLMGenerationEvent['tools'];
  } {
    // Handle different trace data formats
    if (traceData.$ai_generation) {
      // PostHog LLM analytics format
      const aiGen = traceData.$ai_generation as Record<string, unknown>;
      return {
        baseUrl: aiGen.$ai_base_url as string,
        cacheCreationInputTokens:
          aiGen.$ai_cache_creation_input_tokens as number,
        cacheReadInputTokens: aiGen.$ai_cache_read_input_tokens as number,
        error: aiGen.$ai_error as string | Record<string, unknown>,
        httpStatus: aiGen.$ai_http_status as number,
        input: aiGen.$ai_input as LLMGenerationEvent['input'],
        inputCostUsd: aiGen.$ai_input_cost_usd as number,
        inputTokens: aiGen.$ai_input_tokens as number,
        isError: aiGen.$ai_is_error as boolean,
        latency: aiGen.$ai_latency as number,
        maxTokens: aiGen.$ai_max_tokens as number,
        model: aiGen.$ai_model as string,
        outputChoices:
          aiGen.$ai_output_choices as LLMGenerationEvent['outputChoices'],
        outputCostUsd: aiGen.$ai_output_cost_usd as number,
        outputTokens: aiGen.$ai_output_tokens as number,
        provider: aiGen.$ai_provider as string,
        requestUrl: aiGen.$ai_request_url as string,
        spanName: aiGen.$ai_span_name as string,
        stream: aiGen.$ai_stream as boolean,
        temperature: aiGen.$ai_temperature as number,
        tools: aiGen.$ai_tools as LLMGenerationEvent['tools'],
        totalCostUsd: aiGen.$ai_total_cost_usd as number,
      };
    }

    if (traceData.openai) {
      // OpenAI format
      const openai = traceData.openai as Record<string, unknown>;
      return {
        input: (
          openai.messages as Array<{ role: string; content: string }>
        )?.map((msg) => ({
          content: [{ text: msg.content, type: 'text' }],
          role: msg.role,
        })),
        inputTokens: (openai.usage as { prompt_tokens: number })?.prompt_tokens,
        latency: openai.latency as number,
        maxTokens: openai.max_tokens as number,
        model: openai.model as string,
        outputChoices: (
          openai.choices as Array<{ message: { content: string } }>
        )?.map((choice) => ({
          content: [{ text: choice.message?.content, type: 'text' }],
          role: 'assistant',
        })),
        outputTokens: (openai.usage as { completion_tokens: number })
          ?.completion_tokens,
        provider: 'openai',
        spanName: 'openai_completion',
        stream: openai.stream as boolean,
        temperature: openai.temperature as number,
      };
    }

    // Default fallback - try to extract common fields
    return {
      error: traceData.error as string | Record<string, unknown>,
      httpStatus: (traceData.http_status || traceData.status_code) as number,
      input:
        (traceData.input as LLMGenerationEvent['input']) ||
        (traceData.messages as LLMGenerationEvent['input']),
      inputTokens: (traceData.input_tokens ||
        traceData.prompt_tokens) as number,
      isError: (traceData.is_error || traceData.error !== undefined) as boolean,
      latency: (traceData.latency || traceData.duration) as number,
      maxTokens: traceData.max_tokens as number,
      model: (traceData.model || traceData.model_name) as string,
      outputChoices: (traceData.output_choices ||
        traceData.choices) as LLMGenerationEvent['outputChoices'],
      outputTokens: (traceData.output_tokens ||
        traceData.completion_tokens) as number,
      provider: (traceData.provider || traceData.service) as string,
      spanName:
        ((traceData.span_name || traceData.name) as string) || 'llm_generation',
      stream: traceData.stream as boolean,
      temperature: traceData.temperature as number,
    };
  }
}
