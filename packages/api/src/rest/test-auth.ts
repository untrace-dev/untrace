import { createRestApiContext } from './context';

// Test the API key authentication
async function testAuth() {
  console.log('Testing API key authentication...');

  // Test with no authorization header
  const context1 = await createRestApiContext(
    new Request('http://localhost:3000'),
  );
  console.log('Context without auth:', {
    hasApiKey: !!context1.apiKey,
    hasAuth: !!context1.auth,
    hasDb: !!context1.db,
  });

  // Test with invalid authorization header
  const request2 = new Request('http://localhost:3000', {
    headers: {
      authorization: 'Bearer invalid-key',
    },
  });
  const context2 = await createRestApiContext(request2);
  console.log('Context with invalid auth:', {
    hasApiKey: !!context2.apiKey,
    hasAuth: !!context2.auth,
    hasDb: !!context2.db,
  });

  // Test with valid authorization header (this will fail unless you have a valid key)
  const request3 = new Request('http://localhost:3000', {
    headers: {
      authorization: 'Bearer usk-test-live-valid-key',
    },
  });
  const context3 = await createRestApiContext(request3);
  console.log('Context with valid auth:', {
    hasApiKey: !!context3.apiKey,
    hasAuth: !!context3.auth,
    hasDb: !!context3.db,
  });
}

testAuth().catch(console.error);
