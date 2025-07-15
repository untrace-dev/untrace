import { createSingleRouteHandler } from '@ts-rest/next';
import { apiRouter } from '@untrace/api/rest';

// Create the Next.js route handler
const handler = createSingleRouteHandler(apiRouter, {
  responseHeaders: {
    'X-API-Version': 'v1',
  },
});

// Export handlers for all HTTP methods
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
