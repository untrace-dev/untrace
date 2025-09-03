// Import actual implementations from routes
import {
  createDestination,
  deleteDestination,
  getDestination,
  getProvider,
  listDestinations,
  listProviders,
  testDestination,
  testNewDestination,
  updateDestination,
} from '../routes/destinations';

// Export the actual implementations
export {
  createDestination,
  deleteDestination,
  getDestination,
  getProvider,
  listDestinations,
  listProviders,
  testDestination,
  testNewDestination,
  updateDestination,
};

// Export types using Drizzle types
export type DestinationsContract = {
  createDestination: typeof createDestination;
  deleteDestination: typeof deleteDestination;
  getDestination: typeof getDestination;
  getProvider: typeof getProvider;
  listDestinations: typeof listDestinations;
  listProviders: typeof listProviders;
  testDestination: typeof testDestination;
  testNewDestination: typeof testNewDestination;
  updateDestination: typeof updateDestination;
};

// Export the contract object
export const destinationsContract = {
  createDestination,
  deleteDestination,
  getDestination,
  getProvider,
  listDestinations,
  listProviders,
  testDestination,
  testNewDestination,
  updateDestination,
};
