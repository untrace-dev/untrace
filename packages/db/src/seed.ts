import { subDays } from 'date-fns';
import { seed } from 'drizzle-seed';

import { db } from './client';
import {
  ApiKeys,
  ApiKeyUsage,
  Deliveries,
  OrgMembers,
  Orgs,
  Projects,
  ShortUrls,
  Traces,
  Users,
} from './schema';

// Reset all tables

await db.delete(Deliveries);
await db.delete(Traces);
await db.delete(ShortUrls);
await db.delete(ApiKeyUsage);
await db.delete(ApiKeys);
await db.delete(OrgMembers);
await db.delete(Orgs);
await db.delete(Users);
await db.delete(Projects);

const userId = 'user_30oVYOGDYUTdXqB6HImz3XbRyTs';
const orgId = 'org_30oVYhhebEP3q4dSFlxo8DyAxhr';
const orgName = 'seawatts';
const apiKeyId = 'ak_seawatts';
const stripeCustomerId = 'cus_Snv28tYxHudPzx';
const stripeSubscriptionId = 'sub_1RsJCH4hM6DbRRtOGcENjqIO';

await seed(db, {
  ApiKeys,
  ApiKeyUsage,
  Deliveries,
  OrgMembers,
  Orgs,
  Projects,
  ShortUrls,
  Traces,
  Users,
}).refine((funcs) => ({
  ApiKeys: {
    columns: {
      id: funcs.default({ defaultValue: apiKeyId }),
      key: funcs.default({
        defaultValue: 'usk-test-300nYp2JItCuoiHhaioQv82QHwo',
      }),
      orgId: funcs.default({ defaultValue: orgId }),
    },
    count: 1,
  },
  ApiKeyUsage: {
    columns: {
      apiKeyId: funcs.default({
        defaultValue: apiKeyId,
      }),
      createdAt: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 5),
      }),
      metadata: funcs.default({
        defaultValue: {},
      }),
      orgId: funcs.default({ defaultValue: orgId }),
      type: funcs.valuesFromArray({
        values: ['mcp-server'],
      }),
      userId: funcs.default({
        defaultValue: userId,
      }),
    },
    count: 10,
  },
  Deliveries: {
    columns: {
      attempts: funcs.number({ maxValue: 3, minValue: 0 }),
      deliveredAt: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 1),
      }),
      destinationId: funcs.default({ defaultValue: 'od_test_destination' }),
      lastError: funcs.default({ defaultValue: null }),
      lastErrorAt: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 1),
      }),
      nextRetryAt: funcs.date({
        maxDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        minDate: new Date(),
      }),
      responseData: funcs.default({ defaultValue: {} }),
      status: funcs.valuesFromArray({
        values: ['pending', 'success', 'failed', 'retrying', 'cancelled'],
      }),
      traceId: funcs.default({ defaultValue: 'tr_test_trace' }),
      transformedPayload: funcs.default({ defaultValue: {} }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 5,
  },
  OrgMembers: {
    columns: {
      orgId: funcs.default({ defaultValue: orgId }),
      userId: funcs.default({
        defaultValue: userId,
      }),
    },
    count: 1,
  },
  Orgs: {
    columns: {
      clerkOrgId: funcs.default({
        defaultValue: orgId,
      }),
      id: funcs.default({ defaultValue: orgId }),
      name: funcs.default({ defaultValue: orgName }),
      stripeCustomerId: funcs.default({ defaultValue: stripeCustomerId }),
      stripeSubscriptionId: funcs.default({
        defaultValue: stripeSubscriptionId,
      }),
      stripeSubscriptionStatus: funcs.default({
        defaultValue: 'active',
      }),
    },
    count: 1,
  },
  Projects: {
    columns: {
      id: funcs.default({ defaultValue: 'proj_test_project' }),
      name: funcs.default({ defaultValue: 'Test Project' }),
      orgId: funcs.default({ defaultValue: orgId }),
    },
    count: 1,
  },
  ShortUrls: {
    columns: {
      code: funcs.default({ defaultValue: 'test123' }),
      expiresAt: funcs.date({
        maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        minDate: new Date(),
      }),
      isActive: funcs.boolean(),
      orgId: funcs.default({ defaultValue: orgId }),
      redirectUrl: funcs.default({ defaultValue: 'https://example.com' }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 5,
  },
  Traces: {
    columns: {
      data: funcs.default({
        defaultValue: {
          attributes: {},
          name: 'test-trace',
          spans: [],
        },
      }),
      expiresAt: funcs.date({
        maxDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        minDate: new Date(),
      }),
      metadata: funcs.default({ defaultValue: {} }),
      orgId: funcs.default({ defaultValue: orgId }),
      parentSpanId: funcs.default({ defaultValue: 'parent-span-123' }),
      spanId: funcs.default({ defaultValue: 'span-123' }),
      traceId: funcs.default({ defaultValue: 'trace-123' }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 10,
  },
  Users: {
    columns: {
      clerkId: funcs.default({
        defaultValue: userId,
      }),
      email: funcs.default({ defaultValue: 'chris.watts.t@gmail.com' }),
      firstName: funcs.default({ defaultValue: 'Chris' }),
      id: funcs.default({ defaultValue: userId }),
      lastName: funcs.default({ defaultValue: 'Watts' }),
      online: funcs.boolean(),
    },
    count: 1,
  },
}));

process.exit(0);
