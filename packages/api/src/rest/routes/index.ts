import { createNextRoute } from '@ts-rest/next';
import { contract } from '../contract';
import { destinationsRouter } from './destinations';
import { tracesRouter } from './traces';

// Main API router combining all routes
export const routes = createNextRoute(contract, {
  destinations: destinationsRouter,
  traces: tracesRouter,
});
