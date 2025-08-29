# @untrace/email

Email sending package for Untrace using Resend and React Email.

## Features

- 📧 Send transactional emails using Resend
- 🎨 Beautiful email templates with React Email
- 🔧 Type-safe email sending
- 📦 Batch email support

## Installation

```bash
bun add @untrace/email
```

## Configuration

Set the following environment variables:

```env
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@untrace.sh
EMAIL_REPLY_TO=support@untrace.sh # Optional
```

## Usage

### Basic Email Sending

```typescript
import { createEmailClient } from '@untrace/email';
import { WebhookAccessRequestEmail } from '@untrace/email/templates';

const emailClient = createEmailClient({
  apiKey: process.env.RESEND_API_KEY!,
  from: 'noreply@untrace.sh',
  replyTo: 'support@untrace.sh',
});

// Send a single email
await emailClient.send({
  to: 'user@example.com',
  subject: 'New Webhook Access Request',
  template: <WebhookAccessRequestEmail
    requesterName="John Doe"
    requesterEmail="john@example.com"
    webhookName="Production Webhook"
    webhookId="wh_123"
    message="I need access for testing"
    approveUrl="https://untrace.sh/app/approve/123"
    rejectUrl="https://untrace.sh/app/reject/123"
    dashboardUrl="https://untrace.sh/app/dashboard"
  />,
});
```

### Batch Email Sending

```typescript
// Send multiple emails at once
await emailClient.sendBatch([
  {
    to: 'admin1@example.com',
    subject: 'New Access Request',
    template: <NotificationEmail />,
  },
  {
    to: 'admin2@example.com',
    subject: 'New Access Request',
    template: <NotificationEmail />,
  },
]);
```

## Available Templates

### WebhookAccessRequestEmail

Sent to webhook owners when someone requests access.

Props:
- `requesterName`: Name of the person requesting access
- `requesterEmail`: Email of the requester
- `webhookName`: Name of the webhook
- `webhookId`: ID of the webhook
- `message`: Optional message from requester
- `approveUrl`: URL to approve the request
- `rejectUrl`: URL to reject the request
- `dashboardUrl`: URL to the dashboard

### WebhookAccessResponseEmail

Sent to requesters when their access request is approved or rejected.

Props:
- `requesterName`: Name of the requester
- `webhookName`: Name of the webhook
- `webhookId`: ID of the webhook
- `status`: 'approved' | 'rejected'
- `responseMessage`: Optional message from webhook owner
- `dashboardUrl`: URL to the dashboard (for approved requests)
- `cliCommand`: CLI command to get started (for approved requests)

## Development

### Creating New Templates

1. Create a new template in `src/templates/`
2. Export it from `src/templates/index.ts`
3. Use React Email components for styling

Example template:

```tsx
import {
  Body,
  Container,
  Head,
  Html,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface MyEmailProps {
  name: string;
}

export const MyEmail = ({ name }: MyEmailProps) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Text>Hello, {name}!</Text>
      </Container>
    </Body>
  </Html>
);
```

### Testing Templates

You can preview email templates using React Email's preview server:

```bash
cd packages/email
bunx @react-email/preview ./src/templates
```

## License

MIT