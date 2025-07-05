import { appRouter, createTRPCContext } from '@acme/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

const handler = (request: NextRequest) =>
  fetchRequestHandler({
    createContext: () => createTRPCContext(request),
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
  });

export { handler as GET, handler as POST };
