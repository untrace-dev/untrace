import { initContract } from '@ts-rest/core';
import { destinationsContract } from './destinations';
import { tracesContract } from './traces';

const c = initContract();

// Main API contract combining all routes
export const apiContract = c.router(
  {
    destinations: destinationsContract,
    traces: tracesContract,
  },
  {
    pathPrefix: '/api/v1',
    strictStatusCodes: true,
  },
);

export type ApiContract = typeof apiContract;

export {
  type DestinationsContract,
  destinationsContract,
} from './destinations';
// Re-export individual contracts
export { type TracesContract, tracesContract } from './traces';
