import { db } from '@acme/db/client';
import { OrgMembers, Orgs, Users } from '@acme/db/schema';
import type { OrganizationMembershipWebhookEvent } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { handleOrganizationMembershipUpdated } from '../organization-membership-updated';

describe('handleOrganizationMembershipUpdated', () => {
  it('should update an organization membership', async () => {
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    const orgId = 'org_123';
    await db.insert(Users).values({
      id: userId,
      clerkId: userId,
      email: 'example@example.org',
      firstName: 'Example',
      lastName: 'Example',
      avatarUrl: 'https://img.clerk.com/xxxxxx',
    });
    await db.insert(Orgs).values({
      id: orgId,
      clerkOrgId: orgId,
      name: 'Test Org',
      createdByUserId: userId,
    });
    await db.insert(OrgMembers).values({
      userId,
      orgId,
      role: 'user',
    });

    const event = {
      data: {
        created_at: 0,
        id: '123',
        object: 'organization_membership',
        public_metadata: {},
        updated_at: 0,
        permissions: [],
        public_user_data: {
          user_id: userId,
          identifier: 'example@example.org',
          first_name: 'Example',
          last_name: 'Example',
          image_url: 'https://img.clerk.com/xxxxxx',
          has_image: false,
        },
        organization: {
          id: orgId,
          name: 'Test Org',
          slug: 'test-org',
          has_image: false,
          object: 'organization',
          max_allowed_memberships: 10,
          admin_delete_enabled: true,
          public_metadata: {},
          created_at: 0,
          updated_at: 0,
          private_metadata: {},
        },
        role: 'admin',
      },
      object: 'event',
      type: 'organizationMembership.updated',
    } satisfies OrganizationMembershipWebhookEvent;

    const response = await handleOrganizationMembershipUpdated(event);
    expect(response).toBeUndefined();

    const member = await db.query.OrgMembers.findFirst({
      where: eq(OrgMembers.userId, userId),
    });
    expect(member).toBeDefined();
    expect(member?.role).toBe('admin');
    await db.delete(OrgMembers).where(eq(OrgMembers.userId, userId));
    await db.delete(Orgs).where(eq(Orgs.clerkOrgId, orgId));
    await db.delete(Users).where(eq(Users.clerkId, userId));
  });
});
