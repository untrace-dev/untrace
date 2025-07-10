import { db } from '@acme/db/client';
import { Orgs, Users } from '@acme/db/schema';
import type { OrganizationWebhookEvent } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { handleOrganizationUpdated } from '../organization-updated';

describe('handleOrganizationUpdated', () => {
  it('should update an organization', async () => {
    const orgId = 'org_123';
    await db.insert(Users).values({
      clerkId: 'user_1',
      email: 'example@example.org',
      firstName: 'Example',
      id: 'user_1',
      lastName: 'Example',
    });
    await db.insert(Orgs).values({
      clerkOrgId: orgId,
      createdByUserId: 'user_1',
      id: orgId,
      name: 'Old Org',
    });

    const event = {
      data: {
        admin_delete_enabled: true,
        created_at: 0,
        has_image: false,
        id: orgId,
        max_allowed_memberships: 10,
        name: 'New Org',
        object: 'organization',
        public_metadata: {},
        slug: 'new-org',
        updated_at: 0,
      },
      object: 'event',
      type: 'organization.updated',
    } satisfies OrganizationWebhookEvent;

    const response = await handleOrganizationUpdated(event);
    expect(response).toBeUndefined();

    const org = await db.query.Orgs.findFirst({
      where: eq(Orgs.clerkOrgId, orgId),
    });
    expect(org).toBeDefined();
    expect(org?.name).toBe('New Org');
    await db.delete(Orgs).where(eq(Orgs.clerkOrgId, orgId));
    await db.delete(Users).where(eq(Users.clerkId, 'user_1'));
  });
});
