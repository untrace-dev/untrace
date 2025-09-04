import type { TraceType } from '@untrace/db/schema';

describe('TraceFanoutService', () => {
  describe('TraceData interface', () => {
    it('should have the correct structure', () => {
      const mockTrace: TraceType = {
        apiKeyId: null,
        createdAt: new Date(),
        data: {
          llm_generation: {
            input: [{ content: 'Hello', role: 'user' }],
            input_tokens: 10,
            model: 'gpt-4',
            output_choices: [{ content: 'Hi there!', role: 'assistant' }],
            output_tokens: 5,
            provider: 'openai',
          },
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        id: 'test-trace-id',
        metadata: {},
        orgId: 'test-org',
        parentSpanId: null,
        projectId: 'test-project',
        spanId: 'test-span-id',
        traceId: 'test-trace-id',
        updatedAt: null,
        userId: 'test-user',
      };

      expect(mockTrace.traceId).toBe('test-trace-id');
      expect(mockTrace.orgId).toBe('test-org');
      expect(
        (
          (mockTrace.data as Record<string, unknown>).llm_generation as Record<
            string,
            unknown
          >
        ).model,
      ).toBe('gpt-4');
    });
  });

  describe('FanoutContext interface', () => {
    it('should have the correct structure', () => {
      const context = {
        apiKeyId: 'test-api-key',
        orgId: 'test-org',
        projectId: 'test-project',
        userId: 'test-user',
      };

      expect(context.orgId).toBe('test-org');
      expect(context.projectId).toBe('test-project');
      expect(context.apiKeyId).toBe('test-api-key');
    });
  });

  describe('FanoutResult interface', () => {
    it('should have the correct structure', () => {
      const result = {
        destinationsProcessed: 2,
        errors: [],
        success: true,
        tracesProcessed: 1,
      };

      expect(result.success).toBe(true);
      expect(result.tracesProcessed).toBe(1);
      expect(result.destinationsProcessed).toBe(2);
      expect(result.errors).toEqual([]);
    });
  });

  describe('TraceDeliveryJob interface', () => {
    it('should have the correct structure', () => {
      const job = {
        apiKeyId: 'test-api-key',
        metadata: { environment: 'test' },
        orgId: 'test-org',
        projectId: 'test-project',
        traceId: 'test-trace-id',
        userId: 'test-user',
      };

      expect(job.traceId).toBe('test-trace-id');
      expect(job.orgId).toBe('test-org');
      expect(job.projectId).toBe('test-project');
    });
  });
});
