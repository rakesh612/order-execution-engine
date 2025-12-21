import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { config } from './config';
import { orderRoutes } from './routes/order';
import { initializeDatabase, closeDatabase } from './database/client';
import { initializeQueue, closeQueue } from './queue/worker';
import { logger } from './utils/logger';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    } : undefined,
  },
});

async function start() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('✓ Database initialized');

    // Initialize queue workers
    await initializeQueue();
    logger.info('✓ Queue workers initialized');

    // Register plugins
    await fastify.register(cors, {
      origin: true,
    });
    await fastify.register(websocket);

    // Register routes
    await fastify.register(orderRoutes, { prefix: '/api/orders' });

    // Health check endpoint
    fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
    }));

    // Root endpoint
    fastify.get('/', async () => ({
      service: 'Order Execution Engine',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        createOrder: 'POST /api/orders/execute',
        getOrder: 'GET /api/orders/:orderId',
        listOrders: 'GET /api/orders',
        websocket: 'WS /api/orders/status/:orderId',
      },
    }));

    // Start server
    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`🚀 Server running on http://localhost:${config.port}`);
    logger.info(`📊 Health check: http://localhost:${config.port}/health`);
    logger.info(`📝 API endpoint: http://localhost:${config.port}/api/orders/execute`);

  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  try {
    await closeQueue();
    await closeDatabase();
    await fastify.close();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', err);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();