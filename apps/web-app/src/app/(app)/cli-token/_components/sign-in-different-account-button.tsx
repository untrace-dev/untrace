'use client';

import { useClerk } from '@clerk/nextjs';
import { Button } from '@untrace/ui/button';
import { useSearchParams } from 'next/navigation';

export function SignInDifferentAccountButton() {
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const redirectUrl = `/cli-token${
    currentQueryString ? `?${currentQueryString}` : ''
  }`;

  return (
    <Button
      className="w-fit"
      onClick={() =>
        signOut({
          redirectUrl,
        })
      }
      variant="link"
    >
      Sign in with different account
    </Button>
  );
}
