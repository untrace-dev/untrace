'use client';

import { Icons } from '@acme/ui/custom/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@acme/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@acme/ui/sidebar';
import { ToggleGroup, ToggleGroupItem } from '@acme/ui/toggle-group';

import { useUser } from '@clerk/nextjs';
import {
  ArrowLeftFromLine,
  ChevronsUpDown,
  Laptop,
  MoonIcon,
  Plus,
  SunIcon,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { NewOrgDialog } from './new-org-dialog';

export function UserDropdownMenu() {
  const { isMobile } = useSidebar();
  const { setTheme } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();

  // const organizations = user?.getOrgs();
  const [newOrgDialogOpen, setNewOrgDialogOpen] = useState(false);

  const _handleOrgChange = async (orgId: string) => {
    // await setActiveOrg(orgId);
    router.push(`/${orgId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Icons.User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.firstName ||
                      user.emailAddresses[0]?.emailAddress?.split('@')[0]}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium">
                  {user.firstName ||
                    user.emailAddresses[0]?.emailAddress?.split('@')[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.emailAddresses[0]?.emailAddress}
                </div>
              </div>
              <div className="px-2 py-1.5">
                <ToggleGroup
                  className="w-full"
                  onValueChange={(value) => value && setTheme(value)}
                  type="single"
                  value={theme}
                  variant="outline"
                >
                  <ToggleGroupItem aria-label="Light theme" value="light">
                    <SunIcon className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Dark theme" value="dark">
                    <MoonIcon className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="System theme" value="system">
                    <Laptop className="size-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              {/* {organizations
                ?.sort((a, b) => a.orgName.localeCompare(b.orgName))
                .map((org) => (
                  <DropdownMenuItem
                    key={org.orgId}
                    onClick={() => handleOrgChange(org.orgId)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Icons.UsersRound className="size-4 shrink-0" />
                    </div>
                    {org.orgName}
                    {org.orgId === user?.getActiveOrg()?.orgId && (
                      <Icons.Check className="ml-auto size-4" />
                    )}
                  </DropdownMenuItem>
                ))} */}
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setNewOrgDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  New Organization
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href={'/settings/billing'}>
                  <Icons.DollarSign className="mr-1 size-4" />
                  <span>Billing</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={'/settings/members'}>
                  <Users className="mr-1 size-4" />
                  <span>Team</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <ArrowLeftFromLine className="mr-1 size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <NewOrgDialog
        onOpenChange={setNewOrgDialogOpen}
        open={newOrgDialogOpen}
      />
    </>
  );
}
