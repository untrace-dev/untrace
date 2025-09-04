import { Button } from '@untrace/ui/components/button';
import { Separator } from '@untrace/ui/components/separator';
import { SidebarTrigger } from '@untrace/ui/components/sidebar';

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          className="mx-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button asChild className="hidden sm:flex" size="sm" variant="ghost">
            <a
              className="dark:text-foreground"
              href="https://github.com/untrace-dev/untrace"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
