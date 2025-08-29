// Export contracts

// Export client
export { apiClient, createApiClient } from './client';
export type {
  ApiContract,
  DestinationsContract,
  TracesContract,
} from './contract';
export { contract, destinationsContract, tracesContract } from './contract';
// Export router
export { routes } from './routes';
export { destinationsRouter } from './routes/destinations';
export { tracesRouter } from './routes/traces';
