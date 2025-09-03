import { os } from '@orpc/server';
import { destinationsContract } from './destinations';
import { tracesContract } from './traces';

// Main API contract combining all routes
export const router = os.router({
  destinations: destinationsContract,
  traces: tracesContract,
});

export type ApiContract = typeof router;

export {
  type DestinationsContract,
  destinationsContract,
} from './destinations';
// Re-export individual contracts
export { type TracesContract, tracesContract } from './traces';
