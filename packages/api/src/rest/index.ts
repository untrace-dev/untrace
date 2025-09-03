// Export contracts

// Export client
export { apiClient, createApiClient } from './client';
// Export context
export { createRestApiContext } from './context';
export type {
  ApiContract,
  DestinationsContract,
  TracesContract,
} from './contract';
export { destinationsContract, router, tracesContract } from './contract';
export type { ApiKeyContext } from './middleware/auth';
// Export middleware
export { validateApiKey } from './middleware/auth';

// Export router
export { routes } from './routes';
export { destinationsRouter } from './routes/destinations';
export { tracesRouter } from './routes/traces';
