import { eq } from 'drizzle-orm';
import { db } from '../client';
import { OrgMembers, Projects } from '../schema';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Ensures a default project exists for an organization
 * If no project exists, creates a "Default" project
 * If a project already exists, returns the first one found
 */
export async function ensureDefaultProject({
  orgId,
  userId,
  tx,
}: {
  orgId: string;
  userId: string;
  tx: Transaction;
}) {
  const existingProject = await tx.query.Projects.findFirst({
    where: eq(Projects.orgId, orgId),
  });

  if (existingProject) {
    return existingProject;
  }

  const [project] = await tx
    .insert(Projects)
    .values({
      createdByUserId: userId,
      name: 'Default',
      orgId,
    })
    .onConflictDoUpdate({
      set: {
        updatedAt: new Date(),
      },
      target: [Projects.orgId, Projects.name],
    })
    .returning();

  if (!project) {
    throw new Error(
      `Failed to create default project for orgId: ${orgId}, userId: ${userId}`,
    );
  }

  return project;
}

/**
 * Gets or creates a default project for an organization
 * This function can be used outside of transactions
 */
export async function getOrCreateDefaultProject({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  return await db.transaction(async (tx) => {
    return await ensureDefaultProject({ orgId, tx, userId });
  });
}

/**
 * Gets or creates a default project for an organization without requiring userId
 * This function can be used when userId is not available
 */
export async function getOrCreateDefaultProjectWithoutUser({
  orgId,
}: {
  orgId: string;
}) {
  return await db.transaction(async (tx) => {
    // First try to find an existing project
    const existingProject = await tx.query.Projects.findFirst({
      where: eq(Projects.orgId, orgId),
    });

    if (existingProject) {
      return existingProject;
    }

    // If no project exists, we need to create one
    // We'll use a system user ID or find the first user in the org
    const orgMember = await tx.query.OrgMembers.findFirst({
      where: eq(OrgMembers.orgId, orgId),
    });

    const userId = orgMember?.userId || 'system';

    const [project] = await tx
      .insert(Projects)
      .values({
        createdByUserId: userId,
        name: 'Default',
        orgId,
      })
      .onConflictDoUpdate({
        set: {
          updatedAt: new Date(),
        },
        target: [Projects.orgId, Projects.name],
      })
      .returning();

    if (!project) {
      throw new Error(`Failed to create default project for orgId: ${orgId}`);
    }

    return project;
  });
}
