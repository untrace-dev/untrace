/** biome-ignore-all lint/complexity/noBannedTypes: example */
import { IntegrationsManager, type LLMGenerationEvent } from './index';

// Example configuration
const config = {
  datadog: {
    apiKey: process.env.DATADOG_API_KEY,
    enabled: false, // Not implemented yet
  },
  mixpanel: {
    apiKey: process.env.MIXPANEL_API_KEY,
    enabled: true,
    endpoint: 'https://api.mixpanel.com',
  },
  posthog: {
    apiKey: process.env.POSTHOG_API_KEY,
    enabled: true,
    endpoint: 'https://us.i.posthog.com',
    options: {
      flushAt: 20,
      flushInterval: 10000,
    },
  },
  s3: {
    apiKey: process.env.AWS_ACCESS_KEY_ID,
    enabled: false, // Not implemented yet
  },
  webhook: {
    apiKey: process.env.WEBHOOK_API_KEY,
    enabled: true,
    endpoint: 'https://your-webhook-endpoint.com/events',
    options: {
      headers: {
        'X-Custom-Header': 'value',
      },
    },
  },
};

// Initialize the integrations manager
const integrations = new IntegrationsManager(config);

// Example 1: Basic usage with trace context
async function exampleBasicUsage() {
  // Create a trace context
  const traceContext = integrations.createTraceContext({
    distinctId: 'user_123',
    properties: {
      feature: 'chat',
      session_id: 'session_456',
    },
    spanName: 'chat_completion',
  });

  // Create a generation event
  const generationEvent: LLMGenerationEvent = {
    distinctId: traceContext.distinctId,
    httpStatus: 200,
    input: [
      {
        content: [
          {
            text: 'What is the capital of France?',
            type: 'text',
          },
        ],
        role: 'user',
      },
    ],
    inputTokens: 10,
    latency: 1.2,
    maxTokens: 100,
    model: 'gpt-4',
    outputChoices: [
      {
        content: [
          {
            text: 'The capital of France is Paris.',
            type: 'text',
          },
        ],
        role: 'assistant',
      },
    ],
    outputTokens: 8,
    properties: traceContext.properties,
    provider: 'openai',
    spanId: traceContext.spanId,
    spanName: traceContext.spanName,
    temperature: 0.7,
    traceId: traceContext.traceId,
  };

  // Create trace data and capture the event
  const traceData = integrations.createTraceData(
    traceContext.traceId,
    { $ai_generation: generationEvent },
    'unknown',
    {
      spanId: traceContext.spanId,
      userId: traceContext.distinctId,
    },
  );

  await integrations.captureTrace(traceData);
}

// Example 2: Error handling
async function exampleErrorHandling() {
  const traceContext = integrations.createTraceContext({
    distinctId: 'user_123',
    spanName: 'chat_completion',
  });

  try {
    // Simulate an LLM call that fails
    throw new Error('API rate limit exceeded');
  } catch (error) {
    if (error instanceof Error) {
      const traceData = integrations.createTraceData(
        traceContext.traceId,
        {
          $ai_generation: {
            distinctId: traceContext.distinctId,
            error: error.message,
            isError: true,
            model: 'gpt-4',
            properties: {
              session_id: 'session_456',
            },
            provider: 'openai',
            traceId: traceContext.traceId,
          },
        },
        'unknown',
        {
          spanId: traceContext.spanId,
          userId: traceContext.distinctId,
        },
      );

      await integrations.captureError(error, traceData);
    }
  }
}

// Example 3: User identification
async function exampleUserIdentification() {
  await integrations.identifyUser('user_123', {
    email: 'john@example.com',
    name: 'John Doe',
    plan: 'premium',
    signup_date: '2024-01-01',
  });
}

// Example 4: Manual event creation
async function exampleManualEvent() {
  const event: LLMGenerationEvent = {
    distinctId: 'user_123',
    input: [
      {
        content: [
          {
            text: 'Hello, world!',
            type: 'text',
          },
        ],
        role: 'user',
      },
    ],
    inputTokens: 5,
    latency: 0.5,
    model: 'gpt-4',
    outputChoices: [
      {
        content: [
          {
            text: 'Hello! How can I help you today?',
            type: 'text',
          },
        ],
        role: 'assistant',
      },
    ],
    outputTokens: 8,
    properties: {
      custom_property: 'value',
    },
    provider: 'openai',
    spanId: 'span_456',
    spanName: 'custom_generation',
    temperature: 0.7,
    traceId: 'trace_123',
  };

  const traceData = integrations.createTraceData(
    event.traceId,
    { $ai_generation: event },
    'unknown',
    {
      spanId: event.spanId,
      userId: event.distinctId,
    },
  );

  await integrations.captureTrace(traceData);
}

// Example 5: Using specific providers
async function exampleSpecificProviders() {
  // Get a specific provider
  const posthogProvider = integrations.getProvider('posthog');
  if (posthogProvider?.isEnabled()) {
    const event: LLMGenerationEvent = {
      distinctId: 'user_123',
      input: [{ content: [{ text: 'Test', type: 'text' }], role: 'user' }],
      inputTokens: 3,
      model: 'gpt-4',
      outputChoices: [
        { content: [{ text: 'Response', type: 'text' }], role: 'assistant' },
      ],
      outputTokens: 2,
      provider: 'openai',
      traceId: integrations.createTraceContext({ distinctId: 'user_123' })
        .traceId,
    };

    const traceData = integrations.createTraceData(
      event.traceId,
      { $ai_generation: event },
      'unknown',
      { userId: event.distinctId },
    );

    await posthogProvider.captureTrace(traceData);
  }

  // Check if a provider is enabled
  if (integrations.isProviderEnabled('mixpanel')) {
    console.log('Mixpanel is enabled');
  }
}

// Example 6: Flushing events
async function exampleFlushing() {
  // Capture some events
  await exampleBasicUsage();

  // Flush all pending events
  await integrations.flush();
}

// Example 7: Backward compatibility with old PostHog API
async function exampleBackwardCompatibility() {
  const posthogProvider = integrations.getProvider('posthog');

  if (posthogProvider && 'captureLLMRequest' in posthogProvider) {
    // These methods are deprecated but still work
    (
      posthogProvider as unknown as {
        captureLLMRequest: Function;
        captureLLMResponse: Function;
      }
    ).captureLLMRequest(
      {
        messages: [{ content: 'Hello', role: 'user' }],
        model: 'gpt-4',
        temperature: 0.7,
      },
      { distinctId: 'user_123' },
    );

    (
      posthogProvider as unknown as {
        captureLLMRequest: Function;
        captureLLMResponse: Function;
      }
    ).captureLLMResponse(
      {
        choices: [{ message: { content: 'Hi there!' } }],
        model: 'gpt-4',
        usage: { completionTokens: 4, promptTokens: 3, totalTokens: 7 },
      },
      {
        messages: [{ content: 'Hello', role: 'user' }],
        model: 'gpt-4',
      },
      { distinctId: 'user_123' },
    );
  }
}

// Export examples for testing
export {
  exampleBasicUsage,
  exampleErrorHandling,
  exampleUserIdentification,
  exampleManualEvent,
  exampleSpecificProviders,
  exampleFlushing,
  exampleBackwardCompatibility,
};
