'use client';

import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import { usePostHog } from '@untrace/analytics/posthog/client';
import { Button } from '@untrace/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@untrace/ui/command';
import { Icons } from '@untrace/ui/custom/icons';
import { cn } from '@untrace/ui/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@untrace/ui/popover';
import { ChevronsUpDown, Plus } from 'lucide-react';
import * as React from 'react';
import { upsertOrg } from '../actions';

interface OrgSelectorProps {
  onSelect?: (orgId: string) => void;
}

export function OrgSelector({ onSelect }: OrgSelectorProps) {
  const { user } = useUser();
  const { organization: activeOrg } = useOrganization();
  const { setActive } = useOrganizationList();
  const userMemberships = user?.organizationMemberships ?? [];

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>(activeOrg?.id || '');
  const [input, setInput] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const posthog = usePostHog();

  // Update value when activeOrg changes
  React.useEffect(() => {
    if (activeOrg?.id) {
      setValue(activeOrg.id);
      onSelect?.(activeOrg.id);
    }
  }, [activeOrg?.id, onSelect]);

  const filteredOrgs = input
    ? userMemberships.filter((membership) =>
        membership.organization.name
          .toLowerCase()
          .includes(input.toLowerCase()),
      )
    : userMemberships;

  // Popover width logic
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<string | undefined>(
    undefined,
  );
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setPopoverWidth(`${triggerRef.current.offsetWidth}px`);
    }
  }, [open]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-full justify-between"
          ref={triggerRef}
          variant="outline"
        >
          {value
            ? userMemberships.find((org) => org.organization.id === value)
                ?.organization.name
            : 'Select or create an organization...'}
          <ChevronsUpDown className="opacity-50 ml-2" size="sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={popoverWidth ? { width: popoverWidth } : {}}
      >
        <Command>
          <CommandInput
            onValueChange={setInput}
            placeholder="Search or create organization..."
            value={input}
          />
          <CommandList>
            <CommandEmpty>
              <Button
                disabled={!input.trim() || isCreating}
                onClick={async () => {
                  if (input.trim()) {
                    setIsCreating(true);
                    try {
                      const clerkOrg = await upsertOrg({ name: input.trim() });

                      if (clerkOrg?.data?.id && setActive) {
                        setActive({ organization: clerkOrg.data.id });
                        onSelect?.(clerkOrg.data.id);
                        setValue(clerkOrg.data.id);
                        setInput('');
                        setOpen(false);
                        posthog?.capture('cli_org_created', {
                          orgId: clerkOrg.data.id,
                          orgName: clerkOrg.data.name,
                        });
                      }
                    } catch (error) {
                      console.error('Failed to create organization:', error);
                      // You might want to show an error toast here
                    } finally {
                      setIsCreating(false);
                    }
                  }
                }}
              >
                {isCreating ? <Icons.Spinner /> : <Plus />}
                Create new organization:{' '}
                <span className="font-semibold">{input}</span>
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {filteredOrgs.map((membership) => (
                <CommandItem
                  key={membership.organization.id}
                  keywords={[membership.organization.name]}
                  onSelect={async () => {
                    setValue(membership.organization.id);
                    setInput('');
                    setOpen(false);
                    if (setActive) {
                      setActive({ organization: membership.organization });
                    }
                    onSelect?.(membership.organization.id);
                    await upsertOrg({
                      clerkOrgId: membership.organization.id,
                      name: membership.organization.name,
                    });
                    posthog?.capture('cli_org_selected', {
                      orgId: membership.organization.id,
                      orgName: membership.organization.name,
                    });
                  }}
                  value={membership.organization.id}
                >
                  {membership.organization.name}
                  <Icons.Check
                    className={cn(
                      'ml-auto',
                      value === membership.organization.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                    size="sm"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OrgSelectorProvider({ onSelect }: OrgSelectorProps) {
  return (
    <React.Suspense fallback={<div>Loading organizations...</div>}>
      <OrgSelector onSelect={onSelect} />
    </React.Suspense>
  );
}
