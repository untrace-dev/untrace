import { CreateDestinationDialog } from './_components/create-destination-dialog';
import { DestinationsTable } from './_components/destinations-table';

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="text-2xl font-bold">Destinations</div>
          <div className="text-sm text-muted-foreground">
            Configure where your trace data should be sent and monitor delivery
            performance.
          </div>
        </div>
        <CreateDestinationDialog projectId={projectId} />
      </div>

      <DestinationsTable projectId={projectId} />
    </div>
  );
}
