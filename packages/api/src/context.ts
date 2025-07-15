import { getAuth } from '@clerk/nextjs/server';
import { db } from '@untrace/db/client';
import type { NextRequest } from 'next/server';

export const createTRPCContext = (request: NextRequest) => {
  return { auth: getAuth(request), db };
};

export type Context = ReturnType<typeof createTRPCContext>;
