import type { TraceType } from '@untrace/db/schema';
import type { PostHog } from 'posthog-node';
import type {
  IntegrationConfig,
  IntegrationProvider,
  LLMGenerationEvent,
  LLMRequestData,
  LLMResponseData,
  LLMTraceOptions,
} from './types';

export class PostHogIntegration implements IntegrationProvider {
  private posthog: PostHog | null = null;
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.initialize();
  }

  get name(): string {
    return 'posthog';
  }

  isEnabled(): boolean {
    return this.config.enabled && this.posthog !== null;
  }

  private async initialize(): Promise<void> {
    if (!this.config.enabled || !this.config.apiKey) {
      return;
    }

    try {
      // Dynamic import to avoid bundling issues
      const { PostHog } = await import('posthog-node');
      this.posthog = new PostHog(this.config.apiKey, {
        flushAt: 20,
        flushInterval: 10000,
        host: this.config.endpoint || 'https://us.i.posthog.com',
        ...this.config.options,
      });
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  async captureTrace(trace: TraceType): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      // Transform trace data to PostHog LLM analytics format
      const generationEvent = this.transformTraceToPostHogFormat(trace);

      const properties = {
        $ai_base_url: generationEvent.baseUrl,
        $ai_cache_creation_input_tokens:
          generationEvent.cacheCreationInputTokens,

        // Cache properties
        $ai_cache_read_input_tokens: generationEvent.cacheReadInputTokens,
        $ai_error: generationEvent.error,
        $ai_http_status: generationEvent.httpStatus,
        $ai_input: generationEvent.input,

        // Cost properties
        $ai_input_cost_usd: generationEvent.inputCostUsd,
        $ai_input_tokens: generationEvent.inputTokens,
        $ai_is_error: generationEvent.isError || false,

        // Optional properties
        $ai_latency: generationEvent.latency,
        $ai_max_tokens: generationEvent.maxTokens,
        $ai_model: generationEvent.model,
        $ai_output_choices: generationEvent.outputChoices,
        $ai_output_cost_usd: generationEvent.outputCostUsd,
        $ai_output_tokens: generationEvent.outputTokens,
        $ai_parent_id: generationEvent.parentId,
        $ai_provider: generationEvent.provider,
        $ai_request_url: generationEvent.requestUrl,
        $ai_span_id: generationEvent.spanId,
        $ai_span_name: generationEvent.spanName,
        $ai_stream: generationEvent.stream,

        // Model parameters
        $ai_temperature: generationEvent.temperature,
        $ai_tools: generationEvent.tools,
        $ai_total_cost_usd: generationEvent.totalCostUsd,
        // Core properties
        $ai_trace_id: generationEvent.traceId,

        // Additional properties
        ...generationEvent.properties,
      };

      // Remove undefined values
      const cleanProperties = Object.fromEntries(
        Object.entries(properties).filter(([_, value]) => value !== undefined),
      );

      this.posthog?.capture({
        distinctId: generationEvent.distinctId || 'anonymous',
        event: '$ai_generation',
        properties: cleanProperties,
      });
    } catch (error) {
      console.error('Failed to capture PostHog trace:', error);
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

      await this.captureTrace({
        ...trace,
        data: { $ai_generation: errorEvent },
      });
    } catch (captureError) {
      console.error('Failed to capture PostHog error:', captureError);
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
      this.posthog?.identify({
        distinctId,
        properties,
      });
    } catch (error) {
      console.error('Failed to identify PostHog user:', error);
    }
  }

  async flush(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.posthog?.flush();
    } catch (error) {
      console.error('Failed to flush PostHog events:', error);
    }
  }

  /**
   * Transform trace data to PostHog LLM analytics format
   */
  private transformTraceToPostHogFormat(trace: TraceType): LLMGenerationEvent {
    const traceData = trace.data as Record<string, unknown>;

    // If already in PostHog format, extract it
    if (traceData.$ai_generation) {
      const aiGen = traceData.$ai_generation as LLMGenerationEvent;
      return {
        ...aiGen,
        distinctId: trace.userId || undefined,
        properties: {
          ...aiGen.properties,
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
    if (traceData.llm_generation) {
      // Generic LLM generation format
      const llmGen = traceData.llm_generation as Record<string, unknown>;
      return {
        baseUrl: llmGen.base_url as string,
        cacheCreationInputTokens: llmGen.cache_creation_input_tokens as number,
        cacheReadInputTokens: llmGen.cache_read_input_tokens as number,
        error: llmGen.error as string | Record<string, unknown>,
        httpStatus: llmGen.http_status as number,
        input: llmGen.input as LLMGenerationEvent['input'],
        inputCostUsd: llmGen.input_cost_usd as number,
        inputTokens: llmGen.input_tokens as number,
        isError: llmGen.is_error as boolean,
        latency: llmGen.latency as number,
        maxTokens: llmGen.max_tokens as number,
        model: llmGen.model as string,
        outputChoices:
          llmGen.output_choices as LLMGenerationEvent['outputChoices'],
        outputCostUsd: llmGen.output_cost_usd as number,
        outputTokens: llmGen.output_tokens as number,
        provider: llmGen.provider as string,
        requestUrl: llmGen.request_url as string,
        spanName: llmGen.span_name as string,
        stream: llmGen.stream as boolean,
        temperature: llmGen.temperature as number,
        tools: llmGen.tools as LLMGenerationEvent['tools'],
        totalCostUsd: llmGen.total_cost_usd as number,
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

  // Backward compatibility methods
  private convertRequestToGenerationEvent(
    requestData: LLMRequestData,
    responseData: LLMResponseData,
    options: LLMTraceOptions = {},
  ): LLMGenerationEvent {
    const traceId =
      options.traceId ||
      `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      distinctId: options.distinctId,
      input: requestData.messages.map((msg) => ({
        content: [{ text: msg.content, type: 'text' }],
        role: msg.role,
      })),
      inputTokens: responseData.usage?.promptTokens || 0,
      maxTokens: requestData.maxTokens,
      model: responseData.model,
      outputChoices: responseData.choices.map((choice) => ({
        content: [{ text: choice.message.content, type: 'text' }],
        role: 'assistant',
      })),
      outputTokens: responseData.usage?.completionTokens || 0,
      properties: {
        ...options.properties,
        finish_reason: responseData.choices[0]?.finishReason,
      },
      provider: 'openai', // Default, should be configurable
      spanId: options.traceId,
      spanName: 'llm_generation',
      stream: requestData.stream,
      temperature: requestData.temperature,
      tools: requestData.tools,
      traceId,
    };
  }

  /**
   * @deprecated Use captureTrace instead
   */
  captureLLMRequest(
    _requestData: LLMRequestData,
    _options: LLMTraceOptions = {},
  ): void {
    console.warn('captureLLMRequest is deprecated. Use captureTrace instead.');
    // This method is kept for backward compatibility but doesn't capture anything
    // as PostHog LLM analytics expects complete generation events
  }

  /**
   * @deprecated Use captureTrace instead
   */
  captureLLMResponse(
    responseData: LLMResponseData,
    requestData: LLMRequestData,
    options: LLMTraceOptions = {},
  ): void {
    console.warn('captureLLMResponse is deprecated. Use captureTrace instead.');

    const event = this.convertRequestToGenerationEvent(
      requestData,
      responseData,
      options,
    );
    this.captureTrace({
      apiKeyId: null,
      createdAt: new Date(),
      data: { $ai_generation: event },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      id: event.traceId,
      metadata: {},
      orgId: 'unknown',
      parentSpanId: event.parentId ?? null,
      projectId: 'unknown',
      spanId: event.spanId ?? null,
      traceId: event.traceId,
      updatedAt: null,
      userId: event.distinctId ?? null,
    });
  }

  /**
   * @deprecated Use captureError instead
   */
  captureLLMError(
    _error: Error,
    requestData: LLMRequestData,
    options: LLMTraceOptions = {},
  ): void {
    console.warn('captureLLMError is deprecated. Use captureError instead.');

    const event: LLMGenerationEvent = {
      distinctId: options.distinctId,
      input: requestData.messages.map((msg) => ({
        content: [{ text: msg.content, type: 'text' }],
        role: msg.role,
      })),
      inputTokens: 0,
      model: requestData.model,
      outputChoices: [],
      outputTokens: 0,
      properties: options.properties,
      provider: 'openai',
      traceId: options.traceId || `error_${Date.now()}`,
    };

    this.captureTrace({
      apiKeyId: null,
      createdAt: new Date(),
      data: { $ai_generation: event },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      id: event.traceId,
      metadata: {},
      orgId: 'unknown',
      parentSpanId: event.parentId ?? null,
      projectId: 'unknown',
      spanId: event.spanId ?? null,
      traceId: event.traceId,
      updatedAt: null,
      userId: event.distinctId ?? null,
    });
  }

  /**
   * @deprecated Use createTraceWrapper with captureTrace instead
   */
  createTraceWrapper<T>(
    operation: () => Promise<T>,
    requestData: LLMRequestData,
    options: LLMTraceOptions = {},
  ): Promise<T> {
    console.warn(
      'createTraceWrapper is deprecated. Use captureTrace directly.',
    );

    const traceId =
      options.traceId ||
      `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    return operation()
      .then((result) => {
        const responseData = result as LLMResponseData;
        const event = this.convertRequestToGenerationEvent(
          requestData,
          responseData,
          {
            ...options,
            traceId,
          },
        );
        event.latency = (Date.now() - startTime) / 1000;
        this.captureTrace({
          apiKeyId: null,
          createdAt: new Date(),
          data: { $ai_generation: event },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          id: event.traceId,
          metadata: {},
          orgId: 'unknown',
          parentSpanId: event.parentId ?? null,
          projectId: 'unknown',
          spanId: event.spanId ?? null,
          traceId: event.traceId,
          updatedAt: null,
          userId: event.distinctId ?? null,
        });
        return result;
      })
      .catch((error) => {
        const event: LLMGenerationEvent = {
          distinctId: options.distinctId,
          input: requestData.messages.map((msg) => ({
            content: [{ text: msg.content, type: 'text' }],
            role: msg.role,
          })),
          inputTokens: 0,
          latency: (Date.now() - startTime) / 1000,
          model: requestData.model,
          outputChoices: [],
          outputTokens: 0,
          properties: options.properties,
          provider: 'openai',
          traceId,
        };
        this.captureTrace({
          apiKeyId: null,
          createdAt: new Date(),
          data: { $ai_generation: event },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          id: event.traceId,
          metadata: {},
          orgId: 'unknown',
          parentSpanId: event.parentId ?? null,
          projectId: 'unknown',
          spanId: event.spanId ?? null,
          traceId: event.traceId,
          updatedAt: null,
          userId: event.distinctId ?? null,
        });
        throw error;
      });
  }

  /**
   * @deprecated Use identifyUser instead
   */
  setLLMUserProperties(
    distinctId: string,
    properties: Record<string, unknown>,
  ): void {
    console.warn(
      'setLLMUserProperties is deprecated. Use identifyUser instead.',
    );
    this.identifyUser(distinctId, properties);
  }
}
