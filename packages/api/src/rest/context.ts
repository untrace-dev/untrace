import { auth } from '@clerk/nextjs/server';

export interface RestApiContext {
  auth?: {
    orgId?: string;
    userId?: string;
  };
  apiKeyKey?: string;
}

export async function createRestApiContext(
  request: Request,
): Promise<RestApiContext> {
  const headers = new Headers(request.headers);
  const authorization = headers.get('authorization');
  const clerkAuth = await auth();

  const authContext = {
    orgId: clerkAuth.orgId || undefined,
    userId: clerkAuth.userId || undefined,
  };

  if (!authorization) {
    return {
      apiKeyKey: undefined,
      auth: authContext,
    };
  }

  const apiKey = authorization?.split(' ')[1];

  if (!apiKey) {
    return {
      apiKeyKey: undefined,
      auth: authContext,
    };
  }

  return {
    apiKeyKey: apiKey,
    auth: authContext,
  };
}
