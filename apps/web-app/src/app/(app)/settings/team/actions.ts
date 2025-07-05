'use server';

// import { initBaseAuth } from '@clerk/node';
// import type { UserInOrgMetadata } from '@clerk/node';
import { createSafeActionClient } from 'next-safe-action';
import {
  getOrgMembersSchema,
  inviteMemberSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
} from './validations';

// const clerk = initBaseAuth({
//   authUrl: env.NEXT_PUBLIC_AUTH_URL,
//   apiKey: env.clerk_API_KEY,
// });

// Create the action client
const actionClient = createSafeActionClient();

export const getOrgMembersAction = actionClient
  .schema(getOrgMembersSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { orgId: _orgId } = parsedInput;
      // const result = await clerk.fetchUsersInOrg({
      //   orgId,
      //   includeOrgs: true,
      // });

      return {
        success: true,
        data: [], // result.users.map(mapclerkUserToMember),
      };
    } catch (error) {
      console.error('Failed to fetch org members:', error);
      return { success: false, error: 'Failed to fetch org members' };
    }
  });

export const inviteMemberAction = actionClient
  .schema(inviteMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { email: _email, role: _role, orgId: _orgId } = parsedInput;
      // await clerk.inviteUserToOrg({
      //   email,
      //   orgId,
      //   role,
      // });

      return { success: true };
    } catch (error) {
      console.error('Failed to invite member:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to invite member',
      };
    }
  });

export const updateMemberRoleAction = actionClient
  .schema(updateMemberRoleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { userId: _userId, role: _role, orgId: _orgId } = parsedInput;
      // await clerk.changeUserRoleInOrg({
      //   orgId,
      //   userId,
      //   role,
      // });

      return { success: true };
    } catch (error) {
      console.error('Failed to update member role:', error);
      return { success: false, error: 'Failed to update member role' };
    }
  });

export const removeMemberAction = actionClient
  .schema(removeMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { userId: _userId, orgId: _orgId } = parsedInput;
      // await clerk.removeUserFromOrg({
      //   orgId,
      //   userId,
      // });

      return { success: true };
    } catch (error) {
      console.error('Failed to remove member:', error);
      return { success: false, error: 'Failed to remove member' };
    }
  });
