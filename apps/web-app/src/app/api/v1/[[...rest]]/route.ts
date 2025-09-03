import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';

import { createRestApiContext, router } from '@untrace/api/rest';

const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
});

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    context: await createRestApiContext(request),
    prefix: '/api/v1',
  });

  return response ?? new Response('Not found', { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
