import { createServerFn } from '@ts-rest/core';
import { apiContract } from '../contract';
import { destinationsRouter } from './destinations';
import { tracesRouter } from './traces';

// Main API router combining all routes
export const apiRouter = createServerFn(apiContract, {
  destinations: destinationsRouter,
  traces: tracesRouter,
});
