/**
 * Example usage of the oRPC API
 */

import { createApiClient } from './client';

// Create a client instance
const client = createApiClient('http://localhost:3000', {
  'x-organization-id': 'org_123',
});

// Example: Create a trace
async function createTrace() {
  try {
    const result = await client.traces.create({
      data: {
        completion: 'Hi there!',
        model: 'gpt-4',
        prompt: 'Hello, world!',
        tokens: { completion: 2, prompt: 3 },
      },
      spanId: 'span_456',
      traceId: 'trace_123',
      ttlDays: 30,
    });

    console.log('Trace created:', result);
  } catch (error) {
    console.error('Error creating trace:', error);
  }
}

// Example: List traces
async function listTraces() {
  try {
    const result = await client.traces.all({
      limit: 10,
      offset: 0,
    });

    console.log(`Found ${result.total} traces`);
    result.traces.forEach((trace) => {
      console.log(`- ${trace.id}: ${trace.traceId}`);
    });
  } catch (error) {
    console.error('Error listing traces:', error);
  }
}

// Example: Create a destination
async function createDestination() {
  try {
    // First, list available providers
    const providers = await client.destinations.listProviders({
      isActive: true,
    });

    const langfuseProvider = providers.providers.find(
      (p) => p.name === 'langfuse',
    );

    if (!langfuseProvider) {
      console.error('Langfuse provider not found');
      return;
    }

    // Create a Langfuse destination
    const result = await client.destinations.createDestination({
      config: {
        provider: 'langfuse',
        providerId: langfuseProvider.id,
        publicKey: 'pk_test_123',
      },
      description: 'Production Langfuse for trace storage',
      destinationId: langfuseProvider.id,
      isEnabled: true,
      name: 'My Langfuse Instance',
    });

    console.log('Destination created:', result);
  } catch (error) {
    console.error('Error creating destination:', error);
  }
}

// Example: Test a destination
async function testDestination(destinationId: string) {
  try {
    const result = await client.destinations.testDestination({
      config: {
        sampleTrace: {
          completion: 'Test response',
          model: 'gpt-3.5-turbo',
          prompt: 'Test prompt',
          tokens: { completion: 5, prompt: 8 },
        },
      },
      id: destinationId,
    });

    console.log('Test result:', result);
  } catch (error) {
    console.error('Error testing destination:', error);
  }
}

// Example: Get a trace
async function getTrace(traceId: string) {
  try {
    const result = await client.traces.byId({
      id: traceId,
    });

    console.log('Trace details:', result);
  } catch (error) {
    console.error('Error getting trace:', error);
  }
}

// Example: Delete a trace
async function deleteTrace(traceId: string) {
  try {
    const result = await client.traces.byId({
      id: traceId,
    });

    console.log('Trace deleted:', result);
  } catch (error) {
    console.error('Error deleting trace:', error);
  }
}

// Example: List destinations
async function listDestinations() {
  try {
    const result = await client.destinations.listDestinations({
      isEnabled: true,
      limit: 10,
      offset: 0,
    });

    console.log(`Found ${result.total} destinations`);
    result.destinations.forEach((destination) => {
      console.log(`- ${destination.id}: ${destination.name}`);
    });
  } catch (error) {
    console.error('Error listing destinations:', error);
  }
}

// Example: Update a destination
async function updateDestination(destinationId: string) {
  try {
    const result = await client.destinations.updateDestination({
      data: {
        description: 'Updated description',
        isEnabled: false,
        name: 'Updated Destination Name',
      },
      id: destinationId,
    });

    console.log('Destination updated:', result);
  } catch (error) {
    console.error('Error updating destination:', error);
  }
}

// Example: Get trace deliveries
async function getTraceDeliveries(traceId: string) {
  try {
    const result = await client.traces.deliveries({
      id: traceId,
      limit: 10,
      offset: 0,
    });

    console.log(`Found ${result.total} deliveries for trace ${traceId}`);
    result.deliveries.forEach((delivery) => {
      console.log(`- ${delivery.id}: ${delivery.status}`);
    });
  } catch (error) {
    console.error('Error getting trace deliveries:', error);
  }
}

// Example: Retry a failed delivery
async function retryDelivery(deliveryId: string) {
  try {
    const result = await client.traces.retry({
      deliveryId,
      traceId: deliveryId,
    });

    console.log('Delivery retry initiated:', result);
  } catch (error) {
    console.error('Error retrying delivery:', error);
  }
}

// Run examples
async function runExamples() {
  console.log('Running oRPC API examples...\n');

  await createTrace();
  await listTraces();
  await createDestination();
  await listDestinations();

  // These would need actual IDs to work
  // await testDestination('dest_123');
  // await getTrace('trace_123');
  // await deleteTrace('trace_123');
  // await updateDestination('dest_123');
  // await getTraceDeliveries('trace_123');
  // await retryDelivery('delivery_123');
}

// Export for use in other files
export {
  createTrace,
  listTraces,
  createDestination,
  testDestination,
  getTrace,
  deleteTrace,
  listDestinations,
  updateDestination,
  getTraceDeliveries,
  retryDelivery,
  runExamples,
};
