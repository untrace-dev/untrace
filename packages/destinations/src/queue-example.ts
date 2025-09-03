import type { TraceDeliveryJob } from './fanout-service';
import { createTraceFanoutService } from './fanout-service';

/**
 * Example: Queue-based trace processing
 *
 * This example shows how the fanout service can be used in a queue-based system
 * where traces are processed asynchronously from the main ingestion endpoint.
 */

// Example queue processor (could be AWS SQS, Redis, etc.)
export class TraceQueueProcessor {
  private fanoutService = createTraceFanoutService();

  /**
   * Process a trace delivery job from the queue
   */
  async processJob(job: TraceDeliveryJob): Promise<void> {
    try {
      console.log('Processing trace delivery job:', job.traceId);

      const result = await this.fanoutService.processTraceDeliveryJob(job);

      if (result.success) {
        console.log(
          'Successfully processed trace',
          job.traceId,
          'to',
          result.destinationsProcessed,
          'destinations',
        );
      } else {
        console.error(
          'Failed to process trace',
          job.traceId,
          ':',
          result.errors,
        );
      }
    } catch (error) {
      console.error('Error processing trace delivery job:', error);
      throw error;
    }
  }

  /**
   * Process multiple jobs in batch
   */
  async processBatch(jobs: TraceDeliveryJob[]): Promise<void> {
    const promises = jobs.map((job) => this.processJob(job));
    await Promise.allSettled(promises);
  }
}

// Example: How to use with AWS SQS
export class SQSTraceProcessor {
  private fanoutService = createTraceFanoutService();

  /**
   * Process SQS message containing trace delivery job
   */
  async processSQSMessage(message: { Body: string }): Promise<void> {
    try {
      const job: TraceDeliveryJob = JSON.parse(message.Body);
      await this.fanoutService.processTraceDeliveryJob(job);
    } catch (error) {
      console.error('Error processing SQS message:', error);
      throw error;
    }
  }
}

// Example: How to use with Redis
export class RedisTraceProcessor {
  private fanoutService = createTraceFanoutService();

  /**
   * Process Redis message containing trace delivery job
   */
  async processRedisMessage(message: string): Promise<void> {
    try {
      const job: TraceDeliveryJob = JSON.parse(message);
      await this.fanoutService.processTraceDeliveryJob(job);
    } catch (error) {
      console.error('Error processing Redis message:', error);
      throw error;
    }
  }
}

// Example: How to use with a simple in-memory queue
export class InMemoryTraceQueue {
  private fanoutService = createTraceFanoutService();
  private queue: TraceDeliveryJob[] = [];
  private processing = false;

  /**
   * Add a job to the queue
   */
  enqueue(job: TraceDeliveryJob): void {
    this.queue.push(job);
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process all jobs in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      try {
        await this.fanoutService.processTraceDeliveryJob(job);
      } catch (error) {
        console.error('Error processing job:', error);
        // Could implement retry logic here
      }
    }

    this.processing = false;
  }
}

// Example: How to use with a worker pool
export class WorkerPoolTraceProcessor {
  private fanoutService = createTraceFanoutService();
  private workers: Promise<void>[] = [];
  private maxWorkers = 5;

  /**
   * Process jobs using a worker pool
   */
  async processWithWorkers(jobs: TraceDeliveryJob[]): Promise<void> {
    const chunks = this.chunkArray(
      jobs,
      Math.ceil(jobs.length / this.maxWorkers),
    );

    this.workers = chunks.map((chunk) => this.worker(chunk));
    await Promise.all(this.workers);
  }

  /**
   * Worker function to process a chunk of jobs
   */
  private async worker(jobs: TraceDeliveryJob[]): Promise<void> {
    for (const job of jobs) {
      try {
        await this.fanoutService.processTraceDeliveryJob(job);
      } catch (error) {
        console.error('Worker error:', error);
      }
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Example: How to use with a scheduled processor
export class ScheduledTraceProcessor {
  private interval: NodeJS.Timeout | null = null;

  /**
   * Start processing jobs on a schedule
   */
  startProcessing(intervalMs = 5000): void {
    this.interval = setInterval(async () => {
      await this.processPendingJobs();
    }, intervalMs);
  }

  /**
   * Stop processing
   */
  stopProcessing(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Process pending jobs (implement based on your storage)
   */
  private async processPendingJobs(): Promise<void> {
    // This would typically query your database for pending jobs
    // For now, just a placeholder
    console.log('Processing pending jobs...');
  }
}
