import { os } from '@orpc/server';
import { destinationsRouter } from './destinations';
import { tracesRouter } from './traces';

// Main API router combining all routes
export const routes = os.router({
  destinations: destinationsRouter,
  traces: tracesRouter,
});
