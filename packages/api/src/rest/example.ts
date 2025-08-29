/**
 * Example usage of the REST API
 */

import { createApiClient } from './client';

// Create a client instance
const client = createApiClient('http://localhost:3000', {
  'x-organization-id': 'org_123',
});

// Example: Create a trace
async function createTrace() {
  const result = await client.traces.createTrace({
    body: {
      data: {
        completion: 'Hi there!',
        model: 'gpt-4',
        prompt: 'Hello, world!',
        tokens: { completion: 2, prompt: 3 },
      },
      spanId: 'span_456',
      traceId: 'trace_123',
      ttlDays: 30,
    },
  });

  if (result.status === 201) {
    console.log('Trace created:', result.body);
  } else {
    console.error('Error creating trace:', result.body.error);
  }
}

// Example: List traces
async function listTraces() {
  const result = await client.traces.listTraces({
    query: {
      limit: 10,
      offset: 0,
    },
  });

  if (result.status === 200) {
    console.log(`Found ${result.body.total} traces`);
    result.body.traces.forEach((trace) => {
      console.log(`- ${trace.id}: ${trace.traceId}`);
    });
  }
}

// Example: Create a destination
async function createDestination() {
  // First, list available providers
  const providersResult = await client.destinations.listProviders({
    query: { isActive: true },
  });

  if (providersResult.status !== 200) {
    console.error('Failed to list providers');
    return;
  }

  const langfuseProvider = providersResult.body.providers.find(
    (p) => p.type === 'langfuse',
  );

  if (!langfuseProvider) {
    console.error('Langfuse provider not found');
    return;
  }

  // Create a Langfuse destination
  const result = await client.destinations.createDestination({
    body: {
      config: {
        publicKey: 'pk_test_123',
      },
      description: 'Production Langfuse for trace storage',
      isEnabled: true,
      name: 'My Langfuse Instance',
      providerId: langfuseProvider.id,
    },
  });

  if (result.status === 201) {
    console.log('Destination created:', result.body);
  } else {
    console.error('Error creating destination:', result.body.error);
  }
}

// Example: Test a destination
async function testDestination(destinationId: string) {
  const result = await client.destinations.testDestination({
    body: {
      sampleTrace: {
        completion: 'Test response',
        model: 'gpt-3.5-turbo',
        prompt: 'Test prompt',
      },
    },
    params: { id: destinationId },
  });

  if (result.status === 200) {
    console.log('Test result:', result.body);
  } else {
    console.error('Test failed:', result.body.error);
  }
}

// Example: Get trace deliveries
async function getTraceDeliveries(traceId: string) {
  const result = await client.traces.getTraceDeliveries({
    params: { id: traceId },
    query: { limit: 10, offset: 0 },
  });

  if (result.status === 200) {
    console.log(`Found ${result.body.total} deliveries for trace ${traceId}`);
    result.body.deliveries.forEach((delivery) => {
      console.log(
        `- ${delivery.destinationId}: ${delivery.status} (${delivery.attempts} attempts)`,
      );
    });
  }
}

// Export examples
export {
  createTrace,
  listTraces,
  createDestination,
  testDestination,
  getTraceDeliveries,
};
