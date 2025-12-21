import { Queue } from 'bullmq';
import { config } from '../config';
import { Order } from '../types/order.types';
import { logger } from '../utils/logger';

export const orderQueue = new Queue('order-execution', {
  connection: {
    host: new URL(config.redis.url).hostname,
    port: parseInt(new URL(config.redis.url).port || '6379'),
  },
  defaultJobOptions: {
    attempts: config.execution.maxRetries,
    backoff: {
      type: 'exponential',
      delay: config.execution.retryDelayMs,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

export async function addOrderToQueue(order: Order): Promise<void> {
  await orderQueue.add(
    'execute-order',
    { order },
    {
      jobId: order.orderId,
    }
  );
  logger.info('Order added to queue', { orderId: order.orderId });
}