import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { Suspense } from 'react';
import { CliTokenContent } from './_components/cli-token-content';
import { SignInDifferentAccountButton } from './_components/sign-in-different-account-button';

export default function CliTokenPage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle>Login to CLI</CardTitle>
          <CardDescription>
            Select or create an organization, then click the button below to
            authenticate with the Untrace CLI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CliTokenContent />
        </CardContent>
      </Card>
      <Suspense>
        <SignInDifferentAccountButton />
      </Suspense>
    </div>
  );
}
