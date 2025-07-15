'use client';

import { SignOutButton, useUser } from '@clerk/nextjs';
import { Icons } from '@untrace/ui/custom/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@untrace/ui/dropdown-menu';
import { SidebarMenuButton } from '@untrace/ui/sidebar';
import { ToggleGroup, ToggleGroupItem } from '@untrace/ui/toggle-group';

import {
  ArrowLeftFromLine,
  ChevronDown,
  Laptop,
  MoonIcon,
  SunIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
export function UserDropdownMenu() {
  const { setTheme } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();

  // const organizations = user?.getOrgs();

  const _handleOrgChange = async (_orgId: string) => {
    // await setActiveOrg(orgId);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg">
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-medium">Frontend App</span>
            <span className="text-xs text-muted-foreground">Production</span>
          </div>
          <ChevronDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-popper-anchor-width)"
        side="top"
      >
        <DropdownMenuItem
          className="cursor-default"
          onSelect={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icons.User className="size-4 text-muted-foreground" />
              <span className="font-medium">
                {user?.firstName ||
                  user?.primaryEmailAddress?.emailAddress?.split('@')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <span className="text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
        </DropdownMenuItem>
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
        <DropdownMenuItem>
          <Icons.User className="mr-1 size-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icons.DollarSign className="mr-1 size-4" />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <SignOutButton>
            <ArrowLeftFromLine className="mr-1 size-4" />
            <span>Sign out</span>
          </SignOutButton>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="flex items-center gap-2">
              <Icons.UsersRound className="size-4" />
              Organization
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {/* {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.orgId}
                onClick={() => handleOrgChange(org.orgId)}
              >
                <span>{org.orgName}</span>
                {org.orgId === user?.getActiveOrg()?.orgId && (
                  <Icons.Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))} */}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icons.Settings className="mr-1 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.Plus className="mr-1 size-4" />
              <span>New Organization</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="flex items-center gap-2">
              <Icons.FunctionSquare className="size-4" />
              Project
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <Icons.FunctionSquare className="mr-2 size-4" />
              <span>Frontend App</span>
              <Icons.Check className="ml-auto size-4" />
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.FunctionSquare className="mr-2 size-4" />
              <span>Backend API</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.FunctionSquare className="mr-2 size-4" />
              <span>Mobile App</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icons.Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.Plus className="mr-2 size-4" />
              <span>New Project</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="flex items-center gap-2">
              <Icons.BadgeCheck className="size-4 text-success" />
              Environment
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <Icons.BadgeCheck className="mr-2 size-4 text-success" />
              <span>Production</span>
              <Icons.Check className="ml-auto size-4" />
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.FlaskConical className="mr-2 size-4 text-warning" />
              <span>Staging</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.FlaskConical className="mr-2 size-4 text-muted" />
              <span>Development</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icons.Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.Plus className="mr-2 size-4" />
              <span>New Environment</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
