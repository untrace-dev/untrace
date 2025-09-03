-- Create Supabase RLS functions for requesting_user_id and requesting_org_id
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION requesting_org_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    ''
  )::text;
$$;--> statement-breakpoint

DO $$ BEGIN
    CREATE TYPE "public"."apiKeyUsageType" AS ENUM('mcp-server', 'trace');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."deliveryStatus" AS ENUM('pending', 'success', 'failed', 'retrying', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."localConnectionStatus" AS ENUM('connected', 'disconnected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."stripeSubscriptionStatus" AS ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."userRole" AS ENUM('admin', 'superAdmin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apiKeyUsage" (
	"apiKeyId" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"projectId" varchar NOT NULL,
	"type" "apiKeyUsageType" NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apiKeys" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"key" text NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"name" text NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"projectId" varchar NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "apiKeys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deliveries" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deliveredAt" timestamp with time zone,
	"destinationId" varchar NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"lastError" text,
	"lastErrorAt" timestamp with time zone,
	"nextRetryAt" timestamp with time zone,
	"projectId" varchar NOT NULL,
	"responseData" json,
	"status" "deliveryStatus" DEFAULT 'pending' NOT NULL,
	"traceId" varchar NOT NULL,
	"transformedPayload" json,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "deliveries_traceId_destinationId_unique" UNIQUE("traceId","destinationId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "destinations" (
	"batchSize" integer DEFAULT 100,
	"config" json NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"destinationId" varchar(128) NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"maxRetries" integer DEFAULT 3 NOT NULL,
	"name" varchar(255) NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"projectId" varchar NOT NULL,
	"rateLimit" integer,
	"retryDelayMs" integer DEFAULT 1000 NOT NULL,
	"retryEnabled" boolean DEFAULT true NOT NULL,
	"transformFunction" text,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "destinations_projectId_name_unique" UNIQUE("projectId","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orgMembers" (
	"createdAt" timestamp with time zone DEFAULT now(),
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"role" "userRole" DEFAULT 'user' NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id() NOT NULL,
	CONSTRAINT "orgMembers_userId_orgId_unique" UNIQUE("userId","orgId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orgs" (
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
CREATE TABLE IF NOT EXISTS "projects" (
	"createdAt" timestamp with time zone DEFAULT now(),
	"createdByUserId" varchar DEFAULT requesting_user_id() NOT NULL,
	"description" text,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "projects_orgId_name_unique" UNIQUE("orgId","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shortUrls" (
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
CREATE TABLE IF NOT EXISTS "traces" (
	"apiKeyId" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"data" json NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"metadata" json,
	"orgId" varchar DEFAULT requesting_org_id() NOT NULL,
	"parentSpanId" varchar(32),
	"projectId" varchar NOT NULL,
	"spanId" varchar(32),
	"traceId" varchar(64) NOT NULL,
	"updatedAt" timestamp with time zone,
	"userId" varchar DEFAULT requesting_user_id()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
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
ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeyUsage" ADD CONSTRAINT "apiKeyUsage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_destinationId_destinations_id_fk" FOREIGN KEY ("destinationId") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_traceId_traces_id_fk" FOREIGN KEY ("traceId") REFERENCES "public"."traces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgMembers" ADD CONSTRAINT "orgMembers_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgMembers" ADD CONSTRAINT "orgMembers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orgs" ADD CONSTRAINT "orgs_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortUrls" ADD CONSTRAINT "shortUrls_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shortUrls" ADD CONSTRAINT "shortUrls_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_apiKeyId_apiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."apiKeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_orgId_orgs_id_fk" FOREIGN KEY ("orgId") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traces" ADD CONSTRAINT "traces_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;