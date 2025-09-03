// Standard LLM Generation Event Interface
export interface LLMGenerationEvent {
  // Core properties
  traceId: string;
  spanId?: string;
  spanName?: string;
  parentId?: string;
  model: string;
  provider: string;
  input: Array<{
    role: string;
    content: Array<{
      type: string;
      text?: string;
      image?: string;
      function?: {
        name: string;
        arguments: Record<string, unknown>;
      };
    }>;
  }>;
  inputTokens: number;
  outputChoices: Array<{
    role: string;
    content: Array<{
      type: string;
      text?: string;
      function?: {
        name: string;
        arguments: Record<string, unknown>;
      };
    }>;
  }>;
  outputTokens: number;

  // Optional properties
  latency?: number;
  httpStatus?: number;
  baseUrl?: string;
  requestUrl?: string;
  isError?: boolean;
  error?: string | Record<string, unknown>;

  // Cost properties
  inputCostUsd?: number;
  outputCostUsd?: number;
  totalCostUsd?: number;

  // Cache properties
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;

  // Model parameters
  temperature?: number;
  stream?: boolean;
  maxTokens?: number;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    };
  }>;

  // User context
  distinctId?: string;
  properties?: Record<string, unknown>;
}

// Raw trace data from OpenTelemetry + custom metadata
export interface TraceData {
  // OpenTelemetry fields
  traceId: string;
  spanId?: string;
  parentSpanId?: string;

  // Raw trace payload (JSON)
  data: Record<string, unknown>;

  // Metadata
  metadata?: Record<string, unknown>;

  // User/Org context
  userId?: string;
  orgId: string;

  // Timestamps
  createdAt: Date;
  expiresAt: Date;
}

// Standard Integration Interface
export interface IntegrationProvider {
  name: string;
  isEnabled(): boolean;
  captureTrace(trace: TraceData): Promise<void>;
  captureError(error: Error, trace: TraceData): Promise<void>;
  identifyUser(
    distinctId: string,
    properties: Record<string, unknown>,
  ): Promise<void>;
  flush?(): Promise<void>;
}

// Configuration for each integration
export interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  options?: Record<string, unknown>;
}

// Main integrations configuration
export interface IntegrationsConfig {
  posthog?: IntegrationConfig;
  mixpanel?: IntegrationConfig;
  datadog?: IntegrationConfig;
  webhook?: IntegrationConfig;
  s3?: IntegrationConfig;
  langfuse?: IntegrationConfig;
  [key: string]: IntegrationConfig | undefined;
}

// Trace context for grouping related events
export interface TraceContext {
  traceId: string;
  spanId?: string;
  spanName?: string;
  parentId?: string;
  distinctId?: string;
  properties?: Record<string, unknown>;
}

// LLM Request/Response data for backward compatibility
export interface LLMRequestData {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    };
  }>;
}

export interface LLMResponseData {
  choices: Array<{ message: { content: string }; finishReason?: string }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface LLMTraceOptions {
  distinctId?: string;
  traceId?: string;
  properties?: Record<string, unknown>;
  groups?: Record<string, string>;
  privacyMode?: boolean;
}
