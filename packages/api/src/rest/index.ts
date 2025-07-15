// Export contracts

// Export client
export { apiClient, createApiClient } from './client';
export type {
  ApiContract,
  DestinationsContract,
  TracesContract,
} from './contract';
export { apiContract, destinationsContract, tracesContract } from './contract';
// Export router
export { apiRouter } from './routes';
export { destinationsRouter } from './routes/destinations';
// Export individual routers if needed
export { tracesRouter } from './routes/traces';
