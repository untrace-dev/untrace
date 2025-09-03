import { apiKeyUsageRouter } from './router/api-key-usage';
import { apiKeysRouter } from './router/api-keys';
import { billingRouter } from './router/billing';
import { destinationsRouter } from './router/destinations';
import { orgRouter } from './router/org';
import { orgMembersRouter } from './router/org-members';
import { projectsRouter } from './router/projects';
import { tracesRouter } from './router/traces';
import { userRouter } from './router/user';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  apiKeys: apiKeysRouter,
  apiKeyUsage: apiKeyUsageRouter,
  billing: billingRouter,
  destinations: destinationsRouter,
  org: orgRouter,
  orgMembers: orgMembersRouter,
  projects: projectsRouter,
  traces: tracesRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
