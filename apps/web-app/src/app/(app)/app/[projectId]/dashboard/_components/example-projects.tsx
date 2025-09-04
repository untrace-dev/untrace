'use client';

import { Badge } from '@untrace/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@untrace/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

const exampleProjects = [
  {
    description: 'Simple trace logging for LLM applications',
    href: '/examples/llm-trace-logger',
    name: 'LLM Trace Logger',
    tags: ['TypeScript', 'Python', 'Untrace SDK'],
  },
  {
    description: 'Integrate with OpenTelemetry for observability',
    href: '/examples/opentelemetry',
    name: 'OpenTelemetry Integration',
    tags: ['TypeScript', 'OpenTelemetry'],
  },
  {
    description: 'Add tracing to Langchain applications',
    href: '/examples/langchain',
    name: 'Langchain Tracing',
    tags: ['Python', 'Langchain'],
  },
];

export function ExampleProjects() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Example Projects</CardTitle>
          <Link
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="/examples"
          >
            30+ Examples
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <CardDescription>
          Collection of simple projects built with Untrace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Python</Badge>
          <Badge variant="secondary">Untrace SDK</Badge>
        </div>
        <div className="space-y-3">
          {exampleProjects.map((project) => (
            <Link
              className="group block"
              href={project.href}
              key={project.name}
            >
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                <div>
                  <h4 className="font-medium group-hover:text-primary transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
