import { ApiKeySection } from './_components/api-key-section';
import { ExampleProjects } from './_components/example-projects';
import { DestinationsGrid } from './_components/integrations-grid';
import { SummaryStats } from './_components/summary-stats';

export default function Page() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Left - Activity Overview */}
      <SummaryStats />

      {/* Top Right - API Key Section */}
      <ApiKeySection />

      {/* Bottom Left - Destinations Grid */}
      <DestinationsGrid />

      {/* Bottom Right - Example Projects */}
      <ExampleProjects />
    </div>
  );
}
