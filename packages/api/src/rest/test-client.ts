import { createApiClient } from './client';

// Test the client structure
const client = createApiClient('http://localhost:3000', {
  'x-organization-id': 'org_123',
});

// Log the client structure
console.log('Client structure:', Object.keys(client));
console.log(
  'Destinations:',
  client.destinations ? Object.keys(client.destinations) : 'Not found',
);
console.log(
  'Traces:',
  client.traces ? Object.keys(client.traces) : 'Not found',
);
