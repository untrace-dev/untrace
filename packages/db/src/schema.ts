import { createId } from '@untrace/id';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';

// Helper function to get user ID from Clerk JWT
const requestingUserId = () => sql`requesting_user_id()`;

// Helper function to get org ID from Clerk JWT
const requestingOrgId = () => sql`requesting_org_id()`;

export const userRoleEnum = pgEnum('userRole', ['admin', 'superAdmin', 'user']);
export const localConnectionStatusEnum = pgEnum('localConnectionStatus', [
  'connected',
  'disconnected',
]);
export const stripeSubscriptionStatusEnum = pgEnum('stripeSubscriptionStatus', [
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'paused',
  'trialing',
  'unpaid',
]);

export const apiKeyUsageTypeEnum = pgEnum('apiKeyUsageType', [
  'mcp-server',
  'trace',
]);

export const UserRoleType = z.enum(userRoleEnum.enumValues).enum;
export const LocalConnectionStatusType = z.enum(
  localConnectionStatusEnum.enumValues,
).enum;
export const StripeSubscriptionStatusType = z.enum(
  stripeSubscriptionStatusEnum.enumValues,
).enum;
export const ApiKeyUsageTypeType = z.enum(apiKeyUsageTypeEnum.enumValues).enum;

export const Users = pgTable('user', {
  avatarUrl: text('avatarUrl'),
  clerkId: text('clerkId').unique().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  email: text('email').notNull(),
  firstName: text('firstName'),
  id: varchar('id', { length: 128 }).notNull().primaryKey(),
  lastLoggedInAt: timestamp('lastLoggedInAt', {
    mode: 'date',
    withTimezone: true,
  }),
  lastName: text('lastName'),
  online: boolean('online').default(false).notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export const UsersRelations = relations(Users, ({ many }) => ({
  apiKeys: many(ApiKeys),
  apiKeyUsage: many(ApiKeyUsage),
  orgMembers: many(OrgMembers),
  projects: many(Projects),
  traces: many(Traces),
}));

export type UserType = typeof Users.$inferSelect;

export const CreateUserSchema = createInsertSchema(Users).omit({
  createdAt: true,
  id: true,
  updatedAt: true,
});

export const Orgs = pgTable('orgs', {
  clerkOrgId: text('clerkOrgId').unique().notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  createdByUserId: varchar('createdByUserId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'org' }))
    .notNull()
    .primaryKey(),
  name: text('name').notNull().unique(),
  // Stripe fields
  stripeCustomerId: text('stripeCustomerId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  stripeSubscriptionStatus: stripeSubscriptionStatusEnum(
    'stripeSubscriptionStatus',
  ),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export type OrgType = typeof Orgs.$inferSelect;

export const updateOrgSchema = createInsertSchema(Orgs).omit({
  createdAt: true,
  createdByUserId: true,
  id: true,
  updatedAt: true,
});

export const OrgsRelations = relations(Orgs, ({ one, many }) => ({
  apiKeys: many(ApiKeys),
  apiKeyUsage: many(ApiKeyUsage),
  createdByUser: one(Users, {
    fields: [Orgs.createdByUserId],
    references: [Users.id],
  }),
  destinations: many(Destinations),
  orgMembers: many(OrgMembers),
  projects: many(Projects),
  traces: many(Traces),
}));

// Company Members Table
export const OrgMembers = pgTable(
  'orgMembers',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    }).defaultNow(),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'member' }))
      .notNull()
      .primaryKey(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(requestingOrgId()),
    role: userRoleEnum('role').default('user').notNull(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(requestingUserId()),
  },
  (table) => [
    // Add unique constraint for userId and orgId combination using the simpler syntax
    unique().on(table.userId, table.orgId),
  ],
);

export type OrgMembersType = typeof OrgMembers.$inferSelect & {
  user?: UserType;
  org?: OrgType;
};

export const OrgMembersRelations = relations(OrgMembers, ({ one }) => ({
  org: one(Orgs, {
    fields: [OrgMembers.orgId],
    references: [Orgs.id],
  }),
  user: one(Users, {
    fields: [OrgMembers.userId],
    references: [Users.id],
  }),
}));

// Projects Table
export const Projects = pgTable(
  'projects',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    }).defaultNow(),
    createdByUserId: varchar('createdByUserId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(requestingUserId()),
    description: text('description'),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'proj' }))
      .notNull()
      .primaryKey(),
    name: text('name').notNull(),
    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(requestingOrgId()),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
  },
  (table) => [
    // Ensure unique project names per org
    unique().on(table.orgId, table.name),
  ],
);

export type ProjectType = typeof Projects.$inferSelect;

export const CreateProjectSchema = createInsertSchema(Projects).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
});

export const UpdateProjectSchema = createUpdateSchema(Projects).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
});

export const ProjectsRelations = relations(Projects, ({ one, many }) => ({
  apiKeys: many(ApiKeys),
  createdByUser: one(Users, {
    fields: [Projects.createdByUserId],
    references: [Users.id],
  }),
  destinations: many(Destinations),
  org: one(Orgs, {
    fields: [Projects.orgId],
    references: [Orgs.id],
  }),
  traces: many(Traces),
}));

// API Keys Table
export const ApiKeys = pgTable('apiKeys', {
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  }),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'ak' }))
    .notNull()
    .primaryKey(),
  isActive: boolean('isActive').notNull().default(true),
  key: text('key')
    .notNull()
    .unique()
    .$defaultFn(() => createId({ prefix: 'usk', prefixSeparator: '-live-' })),
  lastUsedAt: timestamp('lastUsedAt', {
    mode: 'date',
    withTimezone: true,
  }),
  name: text('name').notNull(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingOrgId()),
  projectId: varchar('projectId')
    .references(() => Projects.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingUserId()),
});

export type ApiKeyType = typeof ApiKeys.$inferSelect;

export const CreateApiKeySchema = createInsertSchema(ApiKeys).omit({
  createdAt: true,
  id: true,
  lastUsedAt: true,
  orgId: true,
  projectId: true,
  updatedAt: true,
  userId: true,
});

export const UpdateApiKeySchema = createUpdateSchema(ApiKeys).omit({
  createdAt: true,
  id: true,
  orgId: true,
  projectId: true,
  updatedAt: true,
  userId: true,
});

export const ApiKeysRelations = relations(ApiKeys, ({ one, many }) => ({
  org: one(Orgs, {
    fields: [ApiKeys.orgId],
    references: [Orgs.id],
  }),
  project: one(Projects, {
    fields: [ApiKeys.projectId],
    references: [Projects.id],
  }),
  usage: many(ApiKeyUsage),
  user: one(Users, {
    fields: [ApiKeys.userId],
    references: [Users.id],
  }),
}));

// API Key Usage Table
export const ApiKeyUsage = pgTable('apiKeyUsage', {
  apiKeyId: varchar('apiKeyId', { length: 128 })
    .references(() => ApiKeys.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'aku' }))
    .notNull()
    .primaryKey(),
  // Generic metadata for different usage types
  metadata: json('metadata').$type<Record<string, unknown>>(),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingOrgId()),
  projectId: varchar('projectId')
    .references(() => Projects.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  type: apiKeyUsageTypeEnum('type').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingUserId()),
});

export type ApiKeyUsageType = typeof ApiKeyUsage.$inferSelect;

export const CreateApiKeyUsageSchema = createInsertSchema(ApiKeyUsage).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const ApiKeyUsageRelations = relations(ApiKeyUsage, ({ one }) => ({
  apiKey: one(ApiKeys, {
    fields: [ApiKeyUsage.apiKeyId],
    references: [ApiKeys.id],
  }),
  org: one(Orgs, {
    fields: [ApiKeyUsage.orgId],
    references: [Orgs.id],
  }),
  project: one(Projects, {
    fields: [ApiKeyUsage.projectId],
    references: [Projects.id],
  }),
  user: one(Users, {
    fields: [ApiKeyUsage.userId],
    references: [Users.id],
  }),
}));

export const ShortUrls = pgTable('shortUrls', {
  code: varchar('code', { length: 128 }).notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  }),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'shortUrl' }))
    .notNull()
    .primaryKey(),
  isActive: boolean('isActive').notNull().default(true),
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingOrgId()),
  redirectUrl: text('redirectUrl').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingUserId()),
});

export type ShortUrlType = typeof ShortUrls.$inferSelect;

export const CreateShortUrlSchema = createInsertSchema(ShortUrls).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const UpdateShortUrlSchema = createUpdateSchema(ShortUrls).omit({
  createdAt: true,
  id: true,
  orgId: true,
  updatedAt: true,
  userId: true,
});

export const ShortUrlsRelations = relations(ShortUrls, ({ one }) => ({
  org: one(Orgs, {
    fields: [ShortUrls.orgId],
    references: [Orgs.id],
  }),
  user: one(Users, {
    fields: [ShortUrls.userId],
    references: [Users.id],
  }),
}));

// ==================== TRACE STORAGE SCHEMAS ====================

// Enum for delivery status
export const deliveryStatusEnum = pgEnum('deliveryStatus', [
  'pending',
  'success',
  'failed',
  'retrying',
  'cancelled',
]);

export const DeliveryStatus = z.enum(deliveryStatusEnum.enumValues).enum;

// Traces table with TTL support
export const Traces = pgTable('traces', {
  apiKeyId: varchar('apiKeyId').references(() => ApiKeys.id, {
    onDelete: 'cascade',
  }),
  // Timestamps
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  // Core trace data
  data: json('data').notNull(), // Full trace payload

  // TTL support
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  })
    .$defaultFn(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days default
    .notNull(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'tr' }))
    .notNull()
    .primaryKey(),
  metadata: json('metadata'), // Additional metadata

  // Organization and user context
  orgId: varchar('orgId')
    .references(() => Orgs.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingOrgId()),
  parentSpanId: varchar('parentSpanId', { length: 32 }),
  projectId: varchar('projectId')
    .references(() => Projects.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  spanId: varchar('spanId', { length: 32 }), // OTEL span ID

  // OpenTelemetry trace data (JSONB for flexibility)
  traceId: varchar('traceId', { length: 64 }).notNull(), // OTEL trace ID
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'set null',
    })
    .default(requestingUserId()),
});

export type TraceType = typeof Traces.$inferSelect;

export const TracesRelations = relations(Traces, ({ one, many }) => ({
  apiKey: one(ApiKeys, {
    fields: [Traces.apiKeyId],
    references: [ApiKeys.id],
  }),
  deliveries: many(Deliveries),
  org: one(Orgs, {
    fields: [Traces.orgId],
    references: [Orgs.id],
  }),
  project: one(Projects, {
    fields: [Traces.projectId],
    references: [Projects.id],
  }),
  user: one(Users, {
    fields: [Traces.userId],
    references: [Users.id],
  }),
}));

// Organization-specific destination configurations
export const Destinations = pgTable(
  'destinations',
  {
    batchSize: integer('batchSize').default(100),

    // Encrypted configuration (API keys, endpoints, etc.)
    config: json('config').notNull(), // Should be encrypted in application layer

    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    description: text('description'),

    // Reference to destination config by ID (no foreign key)
    destinationId: varchar('destinationId', { length: 128 }).notNull(),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'od' }))
      .notNull()
      .primaryKey(),

    // Settings
    isEnabled: boolean('isEnabled').default(true).notNull(),
    maxRetries: integer('maxRetries').default(3).notNull(),

    name: varchar('name', { length: 255 }).notNull(),

    orgId: varchar('orgId')
      .references(() => Orgs.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(requestingOrgId()),

    // Project assignment
    projectId: varchar('projectId')
      .references(() => Projects.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    // Rate limiting
    rateLimit: integer('rateLimit'), // requests per minute
    retryDelayMs: integer('retryDelayMs').default(1000).notNull(),
    retryEnabled: boolean('retryEnabled').default(true).notNull(),

    // Custom transform function (JavaScript code)
    transformFunction: text('transformFunction'),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
  },
  (table) => [
    // Ensure unique destination names per project
    unique().on(table.projectId, table.name),
  ],
);

export type DestinationType = typeof Destinations.$inferSelect;

export const DestinationsRelations = relations(
  Destinations,
  ({ one, many }) => ({
    deliveries: many(Deliveries),
    org: one(Orgs, {
      fields: [Destinations.orgId],
      references: [Orgs.id],
    }),
    project: one(Projects, {
      fields: [Destinations.projectId],
      references: [Projects.id],
    }),
  }),
);

// Track trace deliveries for retry logic
export const Deliveries = pgTable(
  'deliveries',
  {
    attempts: integer('attempts').default(0).notNull(),

    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    // Success tracking
    deliveredAt: timestamp('deliveredAt', {
      mode: 'date',
      withTimezone: true,
    }),

    destinationId: varchar('destinationId')
      .references(() => Destinations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'td' }))
      .notNull()
      .primaryKey(),

    // Error tracking
    lastError: text('lastError'),
    lastErrorAt: timestamp('lastErrorAt', {
      mode: 'date',
      withTimezone: true,
    }),

    // Next retry
    nextRetryAt: timestamp('nextRetryAt', {
      mode: 'date',
      withTimezone: true,
    }),
    projectId: varchar('projectId')
      .references(() => Projects.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    responseData: json('responseData'),

    // Delivery status
    status: deliveryStatusEnum('status').default('pending').notNull(),

    traceId: varchar('traceId')
      .references(() => Traces.id, {
        onDelete: 'cascade',
      })
      .notNull(),

    // Transformed payload (what was actually sent)
    transformedPayload: json('transformedPayload'),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
  },
  (table) => [
    // Ensure we don't duplicate deliveries
    unique().on(table.traceId, table.destinationId),
  ],
);

export type DeliveryType = typeof Deliveries.$inferSelect;

export const DeliveriesRelations = relations(Deliveries, ({ one }) => ({
  destination: one(Destinations, {
    fields: [Deliveries.destinationId],
    references: [Destinations.id],
  }),
  project: one(Projects, {
    fields: [Deliveries.projectId],
    references: [Projects.id],
  }),
  trace: one(Traces, {
    fields: [Deliveries.traceId],
    references: [Traces.id],
  }),
}));

// Create schemas for validation
export const CreateTraceSchema = createInsertSchema(Traces).omit({
  createdAt: true,
  id: true,
  updatedAt: true,
});

export const CreateDestinationSchema = createInsertSchema(Destinations).omit({
  createdAt: true,
  id: true,
  orgId: true, // Will be set from auth context
  updatedAt: true,
});

export const UpdateDestinationSchema = createInsertSchema(Destinations)
  .omit({
    createdAt: true,
    id: true,
    orgId: true,
    updatedAt: true,
  })
  .partial();

// Export types
export type TCreateTrace = typeof Traces.$inferInsert;
export type TCreateDestination = Omit<
  typeof Destinations.$inferInsert,
  'id' | 'createdAt' | 'updatedAt' | 'orgId'
>;
export type TUpdateDestination = Partial<TCreateDestination>;
