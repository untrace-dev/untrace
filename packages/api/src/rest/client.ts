import { initClient } from '@ts-rest/core';
import { contract } from './contract';

// Create a client instance
export const createApiClient = (
  baseUrl: string,
  headers?: Record<string, string>,
) => {
  return initClient(contract, {
    baseHeaders: headers,
    baseUrl,
  });
};

// Example client for use in the browser
export const apiClient = (orgId: string) =>
  createApiClient(
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000',
    {
      'Content-Type': 'application/json',
      'x-organization-id': orgId,
    },
  );
