CREATE TYPE "public"."apiKeyUsageType" AS ENUM('mcp-server');--> statement-breakpoint
CREATE TYPE "public"."deliveryStatus" AS ENUM('pending', 'success', 'failed', 'retrying', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."destinationType" AS ENUM('langfuse', 'openai', 'langsmith', 'keywords_ai', 's3', 'webhook', 'datadog', 'new_relic', 'grafana', 'prometheus', 'elasticsearch', 'custom');--> statement-breakpoint
CREATE TYPE "public"."localConnectionStatus" AS ENUM('connected', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."stripeSubscriptionStatus" AS ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."userRole" AS ENUM('admin', 'superAdmin', 'user');--> statement-breakpoint
CREATE TABLE "apiKeyUsage" (
	"apiKeyId" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"type" "apiKeyUsageType" NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apiKeys" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"key" text NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"name" text NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "apiKeys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "authCodes" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"sessionId" text NOT NULL,
	"updatedAt" timestamp with time zone,
	"usedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destinationProviders" (
	"configSchema" json NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"defaultTransform" text,
	"description" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"name" varchar(255) NOT NULL,
	"supportsBatchDelivery" boolean DEFAULT true NOT NULL,
	"supportsCustomTransform" boolean DEFAULT true NOT NULL,
	"supportsOpenTelemetry" boolean DEFAULT true NOT NULL,
	"type" "destinationType" NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "destinationProviders_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "orgDestinations" (
	"batchSize" integer DEFAULT 100,
	"config" json NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"maxRetries" integer DEFAULT 3 NOT NULL,
	"name" varchar(255) NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"providerId" varchar NOT NULL,
	"rateLimit" integer,
	"retryDelayMs" integer DEFAULT 1000 NOT NULL,
	"retryEnabled" boolean DEFAULT true NOT NULL,
	"transformFunction" text,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "orgDestinations_orgId_name_unique" UNIQUE("orgId","name")
);
--> statement-breakpoint
CREATE TABLE "orgMembers" (
	"createdAt" timestamp with time zone DEFAULT now(),
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"role" "userRole" DEFAULT 'user' NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "orgMembers_userId_orgId_unique" UNIQUE("userId","orgId")
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"clerkOrgId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"createdByUserId" varchar NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"stripeSubscriptionStatus" "stripeSubscriptionStatus",
	"updatedAt" timestamp with time zone,
	CONSTRAINT "orgs_clerkOrgId_unique" UNIQUE("clerkOrgId"),
	CONSTRAINT "orgs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "shortUrls" (
	"code" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"expiresAt" timestamp with time zone,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"redirectUrl" text NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traceDeliveries" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deliveredAt" timestamp with time zone,
	"destinationId" varchar NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"lastError" text,
	"lastErrorAt" timestamp with time zone,
	"nextRetryAt" timestamp with time zone,
	"responseData" json,
	"status" "deliveryStatus" DEFAULT 'pending' NOT NULL,
	"traceId" varchar NOT NULL,
	"transformedPayload" json,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "traceDeliveries_traceId_destinationId_unique" UNIQUE("traceId","destinationId")
);
--> statement-breakpoint
CREATE TABLE "traces" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"data" json NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"parentSpanId" varchar(32),
	"spanId" varchar(32),
	"traceId" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"avatarUrl" text,
	"clerkId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"firstName" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"lastLoggedInAt" timestamp with time zone,
	"lastName" text,
	"online" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "user_clerkId_unique" UNIQUE("clerkId")
);
--> statement-breakpoint
ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_apiKeyId_apiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."apiKeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authCodes" ADD CONSTRAINT "authCodes_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authCodes" ADD CONSTRAINT "authCodes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgDestinations" ADD CONSTRAINT "orgDestinations_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgDestinations" ADD CONSTRAINT "orgDestinations_providerId_destinationProviders_id_fk" FOREIGN KEY ("providerId") REFERENCES "public"."destinationProviders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgMembers" ADD CONSTRAINT "orgMembers_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgMembers" ADD CONSTRAINT "orgMembers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgs" ADD CONSTRAINT "orgs_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortUrls" ADD CONSTRAINT "shortUrls_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortUrls" ADD CONSTRAINT "shortUrls_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traceDeliveries" ADD CONSTRAINT "traceDeliveries_destinationId_orgDestinations_id_fk" FOREIGN KEY ("destinationId") REFERENCES "public"."orgDestinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traceDeliveries" ADD CONSTRAINT "traceDeliveries_traceId_traces_id_fk" FOREIGN KEY ("traceId") REFERENCES "public"."traces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;