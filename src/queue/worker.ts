import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { Order } from '../types/order.types';
import { orderExecutor } from '../services/order-executor';
import { logger } from '../utils/logger';

let worker: Worker | null = null;

export async function initializeQueue(): Promise<void> {
  worker = new Worker(
    'order-execution',
    async (job: Job<{ order: Order }>) => {
      const { order } = job.data;
      logger.info('Processing order from queue', { orderId: order.orderId, jobId: job.id });

      await orderExecutor.executeWithRetry(order);

      return { orderId: order.orderId, status: 'completed' };
    },
    {
      connection: {
        host: new URL(config.redis.url).hostname,
        port: parseInt(new URL(config.redis.url).port || '6379'),
      },
      concurrency: config.queue.concurrency,
      limiter: {
        max: config.queue.maxOrdersPerMinute,
        duration: 60000, // 1 minute
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info('Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('Queue worker initialized', {
    concurrency: config.queue.concurrency,
    maxOrdersPerMinute: config.queue.maxOrdersPerMinute,
  });
}

export async function closeQueue(): Promise<void> {
  if (worker) {
    await worker.close();
    logger.info('Queue worker closed');
  }
}