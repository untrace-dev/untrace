import { createId } from '@untrace/id';
import { seed } from 'drizzle-seed';

import { db } from './client';
import { Orgs, ShortUrls, Users } from './schema';

// Reset all tables

await db.delete(Users);
await db.delete(Orgs);
await db.delete(ShortUrls);

await seed(db, {
  Orgs,
  ShortUrls,
  Users,
}).refine((funcs) => ({
  Maps: {
    columns: {
      description: funcs.loremIpsum(),
      height: funcs.int({ maxValue: 1000, minValue: 1000 }),
      id: funcs.default({ defaultValue: createId({ prefix: 'map_' }) }),
      name: funcs.city(),
      width: funcs.int({ maxValue: 1000, minValue: 1000 }),
    },
    count: 1,
  },
  Orgs: {
    columns: {
      id: funcs.default({ defaultValue: 'org_2zfnD2T4HMRdxf0NcC1v10sY0Ub' }),
    },
    count: 1,
  },
  Users: {
    columns: {
      clerkId: funcs.default({
        defaultValue: 'user_2zfj0M8ZyrVJVmAc3WO87qHUi0c',
      }),
      email: funcs.email(),
      firstName: funcs.firstName(),
      id: funcs.default({ defaultValue: 'user_2zfj0M8ZyrVJVmAc3WO87qHUi0c' }),
      lastName: funcs.lastName(),
      online: funcs.boolean(),
    },
    count: 1,
  },
}));

process.exit(0);
