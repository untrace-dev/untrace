import { Card, CardContent, CardHeader, CardTitle } from '@untrace/ui/card';

export default function CliTokenSuccessPage() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle>Successfully logged into the CLI</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>You can now close this page.</div>
        {/* <CloseWindowButton /> */}
      </CardContent>
    </Card>
  );
}
