import { db } from './client';
import { DestinationProviders } from './schema';

const providers = [
  {
    configSchema: {
      properties: {
        baseUrl: {
          default: 'https://cloud.langfuse.com',
          description: 'Langfuse API base URL',
          type: 'string',
        },
        publicKey: { description: 'Langfuse public key', type: 'string' },
        secretKey: { description: 'Langfuse secret key', type: 'string' },
      },
      required: ['publicKey', 'secretKey'],
      type: 'object',
    },
    description:
      'Open-source LLM engineering platform for observability, metrics, and testing',
    name: 'Langfuse',
    supportsBatchDelivery: true,
    supportsCustomTransform: true,
    supportsOpenTelemetry: true,
    type: 'langfuse' as const,
  },
  {
    configSchema: {
      properties: {
        apiKey: { description: 'OpenAI API key', type: 'string' },
        orgId: {
          description: 'OpenAI Organization ID (optional)',
          type: 'string',
        },
      },
      required: ['apiKey'],
      type: 'object',
    },
    description: 'OpenAI observability and monitoring',
    name: 'OpenAI',
    supportsBatchDelivery: false,
    supportsCustomTransform: false,
    supportsOpenTelemetry: true,
    type: 'openai' as const,
  },
  {
    configSchema: {
      properties: {
        apiKey: { description: 'LangSmith API key', type: 'string' },
        endpoint: {
          default: 'https://api.smith.langchain.com',
          description: 'LangSmith API endpoint',
          type: 'string',
        },
        projectId: { description: 'LangSmith project ID', type: 'string' },
      },
      required: ['apiKey', 'projectId'],
      type: 'object',
    },
    description: 'LangChain observability and testing platform',
    name: 'LangSmith',
    supportsBatchDelivery: true,
    supportsCustomTransform: true,
    supportsOpenTelemetry: true,
    type: 'langsmith' as const,
  },
  {
    configSchema: {
      properties: {
        apiKey: { description: 'Keywords AI API key', type: 'string' },
        endpoint: {
          default: 'https://api.keywordsai.co',
          description: 'Keywords AI endpoint',
          type: 'string',
        },
      },
      required: ['apiKey'],
      type: 'object',
    },
    description: 'LLM monitoring and optimization platform',
    name: 'Keywords AI',
    supportsBatchDelivery: true,
    supportsCustomTransform: true,
    supportsOpenTelemetry: false,
    type: 'keywords_ai' as const,
  },
  {
    configSchema: {
      properties: {
        accessKeyId: { description: 'AWS access key ID', type: 'string' },
        bucketName: { description: 'S3 bucket name', type: 'string' },
        endpoint: {
          description: 'Custom S3 endpoint (for S3-compatible services)',
          type: 'string',
        },
        prefix: { description: 'S3 key prefix for traces', type: 'string' },
        region: { description: 'AWS region', type: 'string' },
        secretAccessKey: {
          description: 'AWS secret access key',
          type: 'string',
        },
      },
      required: ['bucketName', 'region', 'accessKeyId', 'secretAccessKey'],
      type: 'object',
    },
    description: 'Store traces in Amazon S3 buckets',
    name: 'Amazon S3',
    supportsBatchDelivery: true,
    supportsCustomTransform: true,
    supportsOpenTelemetry: true,
    type: 's3' as const,
  },
  {
    configSchema: {
      properties: {
        headers: {
          additionalProperties: { type: 'string' },
          description: 'Custom headers to send with requests',
          type: 'object',
        },
        method: {
          default: 'POST',
          description: 'HTTP method to use',
          enum: ['POST', 'PUT'],
          type: 'string',
        },
        timeout: {
          default: 30000,
          description: 'Request timeout in milliseconds',
          type: 'number',
        },
        url: { description: 'Webhook URL', type: 'string' },
      },
      required: ['url'],
      type: 'object',
    },
    defaultTransform: `// Transform function receives the trace data and must return the transformed payload
// Available globals: trace (the trace object), destination (the destination config)
function transform(trace, destination) {
  // Default: return trace as-is
  return trace;
}`,
    description: 'Send traces to a custom webhook endpoint',
    name: 'Webhook',
    supportsBatchDelivery: true,
    supportsCustomTransform: true,
    supportsOpenTelemetry: true,
    type: 'webhook' as const,
  },
  {
    configSchema: {
      properties: {
        apiKey: { description: 'Datadog API key', type: 'string' },
        env: { description: 'Environment name', type: 'string' },
        service: { description: 'Service name', type: 'string' },
        site: {
          default: 'datadoghq.com',
          description: 'Datadog site',
          enum: [
            'datadoghq.com',
            'datadoghq.eu',
            'us3.datadoghq.com',
            'us5.datadoghq.com',
          ],
          type: 'string',
        },
        version: { description: 'Application version', type: 'string' },
      },
      required: ['apiKey'],
      type: 'object',
    },
    description: 'Datadog APM and distributed tracing',
    name: 'Datadog',
    supportsBatchDelivery: true,
    supportsCustomTransform: false,
    supportsOpenTelemetry: true,
    type: 'datadog' as const,
  },
];

export async function seedDestinationProviders() {
  console.log('Seeding destination providers...');

  for (const provider of providers) {
    await db
      .insert(DestinationProviders)
      .values(provider)
      .onConflictDoUpdate({
        set: {
          configSchema: provider.configSchema,
          defaultTransform: provider.defaultTransform,
          description: provider.description,
          name: provider.name,
          supportsBatchDelivery: provider.supportsBatchDelivery,
          supportsCustomTransform: provider.supportsCustomTransform,
          supportsOpenTelemetry: provider.supportsOpenTelemetry,
          updatedAt: new Date(),
        },
        target: DestinationProviders.type,
      });
  }

  console.log(`Seeded ${providers.length} destination providers`);
}

// Run if called directly
if (require.main === module) {
  seedDestinationProviders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding destination providers:', error);
      process.exit(1);
    });
}
