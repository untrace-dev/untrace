// Import actual implementations from routes
import { all, byId, create, deliveries, ingest, retry } from '../routes/traces';

// Export the actual implementations
export { all, byId, create, deliveries, ingest, retry };

// Export types using Drizzle types
export type TracesContract = {
  all: typeof all;
  byId: typeof byId;
  create: typeof create;
  deliveries: typeof deliveries;
  ingest: typeof ingest;
  retry: typeof retry;
};

// Export the contract object
export const tracesContract = {
  all,
  byId,
  create,
  deliveries,
  ingest,
  retry,
};
