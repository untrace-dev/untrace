import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import { env } from '../env.client';
import type { router } from './contract';

// Create a client instance
export const createApiClient = (
  baseUrl: string,
  headers?: Record<string, string>,
) => {
  const link = new RPCLink({
    headers,
    url: baseUrl,
  });

  return createORPCClient(link) as RouterClient<typeof router>;
};

// Example client for use in the browser
export const apiClient = ({ apiKey }: { apiKey: string }) =>
  createApiClient(env.NEXT_PUBLIC_API_URL, {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  });
