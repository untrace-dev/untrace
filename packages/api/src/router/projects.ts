import { Projects } from '@untrace/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const projectsRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    const projects = await ctx.db.query.Projects.findMany({
      where: eq(Projects.orgId, ctx.auth.orgId),
    });

    return projects;
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const project = await ctx.db.query.Projects.findFirst({
        where: eq(Projects.id, input.id),
      });

      if (!project || project.orgId !== ctx.auth.orgId) {
        return null;
      }

      return project;
    }),

  byName: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      const project = await ctx.db.query.Projects.findFirst({
        where: and(
          eq(Projects.name, input.name),
          eq(Projects.orgId, ctx.auth.orgId),
        ),
      });

      return project;
    }),

  checkNameAvailability: protectedProcedure
    .input(
      z.object({
        excludeProjectId: z.string().optional(),
        name: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const existingProject = await ctx.db.query.Projects.findFirst({
        where: eq(Projects.name, input.name),
      });

      const isAvailable =
        !existingProject ||
        (input.excludeProjectId &&
          existingProject.id === input.excludeProjectId);

      return {
        available: Boolean(isAvailable),
        message: isAvailable
          ? `Project name '${input.name}' is available`
          : `Project name '${input.name}' already exists`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ description: z.string().optional(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');
      if (!ctx.auth.userId) throw new Error('User ID is required');

      const project = await ctx.db
        .insert(Projects)
        .values({
          createdByUserId: ctx.auth.userId,
          description:
            input.description && input.description.trim() !== ''
              ? input.description
              : null,
          name: input.name,
          orgId: ctx.auth.orgId,
        })
        .returning();

      return project[0];
    }),
});
