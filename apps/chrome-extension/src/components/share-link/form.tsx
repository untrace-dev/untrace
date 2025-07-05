import { api } from '@acme/api/chrome-extension';
import { Button } from '@acme/ui/button';
import { CopyButton } from '@acme/ui/copy-button';
import { Icons } from '@acme/ui/icons';
import { Input } from '@acme/ui/input';
import { Label } from '@acme/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@acme/ui/select';
import { toast } from '@acme/ui/sonner';
import * as React from 'react';

import { useChromePortal } from '~/hooks/use-chrome-portal';
import { useCompany } from '../company/context';

export function ShareLinkForm(props: {
  children: (props: {
    isPending: boolean;
    hasShareLink: boolean;
    isPendingShareLink: boolean;
  }) => React.ReactNode;
  onSuccess?: () => void;
}) {
  const portalElement = useChromePortal();
  const { company, application } = useCompany();

  const apiUtils = api.useUtils();
  const upsertShareLink = api.application.upsertShareLink.useMutation();

  const createContact = api.contact.create.useMutation();
  const upsertShareLinkContacts =
    api.application.upsertShareLinkContacts.useMutation();
  const getShareLink = api.application.getShareLink.useQuery(
    {
      applicationId: application?.id ?? '',
    },
    {
      enabled: !!company?.id && !!application?.id,
    },
  );
  const getShareLinkContacts = api.application.getShareLinkContacts.useQuery(
    {
      shareLinkId: getShareLink.data?.id ?? '',
    },
    {
      enabled: !!getShareLink.data?.id,
    },
  );
  const [passcode, setPasscode] = React.useState('');
  const [privacyLevel, setPrivacyLevel] = React.useState<
    | 'public'
    | 'privateWithPasscode'
    | 'collectEmailAndVerify'
    | 'collectEmailNoVerification'
    | 'limitToSpecificEmails'
  >('public');
  const [specificEmails, setSpecificEmails] = React.useState<string[]>(['']);

  React.useEffect(() => {
    if (getShareLink.data) {
      setPrivacyLevel(getShareLink.data.privacyLevel);
      const emails =
        getShareLinkContacts.data?.map((contact) => contact.email ?? '') ?? [];
      setSpecificEmails(emails.length > 0 ? emails : ['']); // Ensure at least one empty input
    }
  }, [getShareLink.data, getShareLinkContacts.data]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!company?.id || !application?.id) {
      return;
    }

    try {
      const shareLinkResult = await upsertShareLink.mutateAsync({
        applicationId: application.id,
        companyId: company.id,
        id: getShareLink.data?.id,
        passcode,
        privacyLevel,
      });

      if (privacyLevel === 'limitToSpecificEmails') {
        const validEmails = specificEmails.filter(
          (email) => email.trim() !== '',
        );
        let contactIds: string[] = [];
        const contactPromises = validEmails.map((email) => {
          if (company.id) {
            return createContact.mutateAsync({
              companyId: company.id,
              email,
            });
          }
        });
        const contacts = await Promise.all(contactPromises);
        contactIds = contacts
          .map((contact) => contact?.contactId)
          .filter(Boolean) as string[];

        if (shareLinkResult) {
          await upsertShareLinkContacts.mutateAsync({
            companyId: company.id,
            contactIds,
            shareLinkId: shareLinkResult.id,
          });
        }
      }

      await Promise.all([
        apiUtils.application.getShareLink.invalidate(),
        apiUtils.application.getShareLinkContacts.invalidate(),
      ]);
      props.onSuccess?.();
    } catch (error) {
      console.error('Error creating share link or contacts:', error);
      toast.error('Failed to create share link or add contacts');
    }
  };

  const addEmailField = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSpecificEmails([...specificEmails, '']);
  };

  const updateEmail = (index: number, value: string) => {
    const updatedEmails = [...specificEmails];
    updatedEmails[index] = value;
    setSpecificEmails(updatedEmails);
  };

  const removeEmailField = (index: number) => {
    const updatedEmails = specificEmails.filter(
      (_, index_) => index_ !== index,
    );
    setSpecificEmails(updatedEmails.length > 0 ? updatedEmails : ['']); // Ensure at least one empty input
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-y-4 px-4 lg:px-0">
        <div className="space-y-2">
          <Label htmlFor="privacy-level">Privacy Level</Label>
          <Select
            value={privacyLevel}
            onValueChange={(value) =>
              setPrivacyLevel(value as unknown as typeof privacyLevel)
            }
          >
            <SelectTrigger id="privacy-level">
              <SelectValue placeholder="Select privacy level" />
            </SelectTrigger>
            <SelectContent portalContainer={portalElement}>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="privateWithPasscode">
                Private with Passcode
              </SelectItem>
              <SelectItem value="collectEmailAndVerify" disabled>
                Collect Email and Verify (Coming Soon)
              </SelectItem>
              <SelectItem value="collectEmailNoVerification" disabled>
                Collect Email (No Verification) (Coming Soon)
              </SelectItem>
              <SelectItem value="limitToSpecificEmails" disabled>
                Limit to Specific Emails (Coming Soon)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {privacyLevel === 'limitToSpecificEmails' && (
          <div className="space-y-2">
            <Label>Specific Emails</Label>
            {specificEmails.map((email, index) => (
              <div key={email} className="flex items-center gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => updateEmail(index, event.target.value)}
                  placeholder="Enter email"
                  className="flex-grow"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmailField(index)}
                >
                  <Icons.X />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEmailField}>
              Add Another Email
            </Button>
          </div>
        )}

        {privacyLevel === 'privateWithPasscode' && (
          <div className="space-y-2">
            <Label htmlFor="passcode">
              Passcode{' '}
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="passcode"
              name="passcode"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              disabled={upsertShareLink.isPending}
              placeholder="Enter a passcode"
            />
          </div>
        )}
      </div>

      {getShareLink.data && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="share-link">Share Link</Label>
          <div className="flex items-center gap-2">
            <Input
              id="share-link"
              value={getShareLink.data.uniqueLink}
              readOnly
              className="flex-grow"
            />
            <CopyButton text={getShareLink.data.uniqueLink}>
              Copy Link
            </CopyButton>
          </div>
        </div>
      )}

      {props.children({
        hasShareLink: !!getShareLink.data,
        isPending: upsertShareLink.isPending || createContact.isPending,
        isPendingShareLink: getShareLink.isPending,
      })}
    </form>
  );
}
