import { createOrg } from '@untrace/db';
import { ApiKeys, OrgMembers, Orgs, Projects } from '@untrace/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const orgRouter = createTRPCRouter({
  checkNameAvailability: protectedProcedure
    .input(
      z.object({
        excludeOrgId: z.string().optional(),
        name: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First check if the user already has access to an organization with this name
      const existingOrgWithAccess = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.name, input.name),
        with: {
          orgMembers: {
            where: eq(OrgMembers.userId, ctx.auth.userId),
          },
        },
      });

      // If user has access to an org with this name, it's available to them
      if (
        existingOrgWithAccess &&
        existingOrgWithAccess.orgMembers.length > 0
      ) {
        return {
          available: true,
          message: `You already have access to organization '${input.name}'`,
        };
      }

      const existingOrg = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.name, input.name),
      });

      const isAvailable =
        !existingOrg ||
        (input.excludeOrgId && existingOrg.id === input.excludeOrgId);

      return {
        available: Boolean(isAvailable),
        message: isAvailable
          ? `Organization name '${input.name}' is available`
          : `Organization name '${input.name}' already exists`,
      };
    }),
  current: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');
    return ctx.db.query.Orgs.findFirst({
      where: eq(Orgs.id, ctx.auth.orgId),
    });
  }),

  updateName: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(3)
          .max(50)
          .regex(
            /^[a-z0-9-]+$/,
            'Name can only contain lowercase letters, numbers, and hyphens',
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // Check if organization name already exists
      const existingOrg = await ctx.db.query.Orgs.findFirst({
        where: eq(Orgs.name, input.name),
      });

      if (existingOrg && existingOrg.id !== ctx.auth.orgId) {
        throw new Error(`Organization name '${input.name}' already exists`);
      }

      const [updatedOrg] = await ctx.db
        .update(Orgs)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(Orgs.id, ctx.auth.orgId))
        .returning();

      return updatedOrg;
    }),

  // Create a new organization with Stripe integration
  upsert: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(3, 'Organization name must be at least 3 characters'),
        projectName: z
          .string()
          .min(3, 'Project name must be at least 3 characters')
          .max(50, 'Project name must be less than 50 characters')
          .regex(
            /^[a-z0-9-_]+$/,
            'Project name can only contain lowercase letters, numbers, hyphens, and underscores',
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new Error('User ID is required');
      }

      try {
        const existingOrg = await ctx.db.query.Orgs.findFirst({
          where: eq(Orgs.name, input.name),
        });

        if (existingOrg) {
          console.log(
            'Organization already exists in database:',
            existingOrg.id,
          );
          const apiKey = await ctx.db.query.ApiKeys.findFirst({
            where: eq(ApiKeys.orgId, existingOrg.id),
          });

          if (!apiKey) {
            throw new Error('API key not found for existing organization');
          }

          const project = await ctx.db.query.Projects.findFirst({
            where: eq(Projects.id, apiKey.projectId),
          });

          if (!project) {
            throw new Error('Project not found for existing organization');
          }

          return {
            apiKey: {
              id: apiKey.id,
              key: apiKey.key,
              name: apiKey.name,
            },
            org: {
              id: existingOrg.id,
              name: existingOrg.name,
              stripeCustomerId: existingOrg.stripeCustomerId,
            },
            project: {
              id: project.id,
              name: project.name,
            },
          };
        }
      } catch (error) {
        console.error('Failed to check organization name:', error);
        throw new Error('Failed to check organization name');
      }

      try {
        const result = await createOrg({
          name: input.name,
          projectName: input.projectName,
          userId: ctx.auth.userId,
        });

        return result;
      } catch (error) {
        console.error('Failed to create organization:', error);
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Failed to create organization',
        );
      }
    }),
});
