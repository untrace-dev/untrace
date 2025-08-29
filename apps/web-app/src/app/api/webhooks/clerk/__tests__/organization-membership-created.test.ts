import type { OrganizationMembershipWebhookEvent } from '@clerk/nextjs/server';
import { db } from '@untrace/db/client';
import { OrgMembers, Orgs, Users } from '@untrace/db/schema';
import { eq } from 'drizzle-orm';
import { handleOrganizationMembershipCreated } from '../organization-membership-created';

describe('handleOrganizationMembershipCreated', () => {
  it('should create an organization membership and link to user/org', async () => {
    const userId = 'user_29w83sxmDNGwOuEthce5gg56FcC';
    const orgId = 'org_123';
    await db.insert(Users).values({
      avatarUrl: 'https://img.clerk.com/xxxxxx',
      clerkId: userId,
      email: 'example@example.org',
      firstName: 'Example',
      id: userId,
      lastName: 'Example',
    });
    await db.insert(Orgs).values({
      clerkOrgId: orgId,
      createdByUserId: userId,
      id: orgId,
      name: 'Test Org',
    });

    const event = {
      data: {
        created_at: 0,
        id: '123',
        object: 'organization_membership',
        organization: {
          admin_delete_enabled: true,
          created_at: 0,
          has_image: false,
          id: orgId,
          max_allowed_memberships: 10,
          name: 'Test Org',
          object: 'organization',
          public_metadata: {},
          slug: 'test-org',
          updated_at: 0,
        },
        permissions: [],
        public_metadata: {},
        public_user_data: {
          first_name: 'Example',
          has_image: false,
          identifier: 'example@example.org',
          image_url: 'https://img.clerk.com/xxxxxx',
          last_name: 'Example',
          user_id: userId,
        },
        role: 'admin',
        updated_at: 0,
      },
      object: 'event',
      type: 'organizationMembership.created',
    } as unknown as OrganizationMembershipWebhookEvent;

    const response = await handleOrganizationMembershipCreated(event);
    expect(response).toBeUndefined();

    const member = await db.query.OrgMembers.findFirst({
      where: eq(OrgMembers.userId, userId),
    });
    expect(member).toBeDefined();
    expect(member?.orgId).toBe(orgId);
    expect(member?.role).toBe('admin');
    await db.delete(OrgMembers).where(eq(OrgMembers.userId, userId));
    await db.delete(Orgs).where(eq(Orgs.clerkOrgId, orgId));
    await db.delete(Users).where(eq(Users.clerkId, userId));
  });
});
