import { ORPCError, os } from '@orpc/server';
import { eq } from '@untrace/db';
import { db } from '@untrace/db/client';
import { ApiKeys, type ApiKeyType, ApiKeyUsage } from '@untrace/db/schema';
import type { RestApiContext } from '../context';

export interface ApiKeyContext {
  apiKey: ApiKeyType;
}

export async function validateApiKey(apiKey: string): Promise<ApiKeyContext> {
  // Find the API key in the database
  const dbApiKey = await db.query.ApiKeys.findFirst({
    where: eq(ApiKeys.key, apiKey),
  });

  if (!dbApiKey) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Invalid API key',
    });
  }

  // Check if API key is active
  if (!dbApiKey.isActive) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'API key is inactive',
    });
  }

  // Check if API key has expired
  if (dbApiKey.expiresAt && dbApiKey.expiresAt < new Date()) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'API key has expired',
    });
  }

  // Update last used timestamp

  await db.insert(ApiKeyUsage).values({
    apiKeyId: dbApiKey.id,
    orgId: dbApiKey.orgId,
    projectId: dbApiKey.projectId,
    type: 'trace',
    userId: dbApiKey.userId,
  });

  return {
    apiKey: dbApiKey,
  };
}

// oRPC middleware for API key authentication
export const apiKeyAuthMiddleware = os
  .$context<RestApiContext>()
  .middleware(async ({ context, next }) => {
    // If no authorization header, return context without auth
    if (!context.apiKeyKey) {
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Invalid API key',
      });
    }

    try {
      // Validate API key and get context
      const apiKeyContext = await validateApiKey(context.apiKeyKey);

      return next({
        context: {
          ...context,
          apiKey: apiKeyContext.apiKey,
        },
      });
    } catch (_error) {
      // If API key validation fails, return context without auth
      // The individual handlers will handle the authorization errors
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Invalid API key',
      });
    }
  });
