import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { validateOrderRequest } from '../utils/validation';
import { orderRepository } from '../database/repositories/order.repository';
import { addOrderToQueue } from '../queue/order-queue';
import { wsManager } from '../utils/websocket-manager';
import { Order, OrderRequest } from '../types/order.types';
import { logger } from '../utils/logger';

export async function orderRoutes(fastify: FastifyInstance) {
  
  // POST /api/orders/execute - Create and execute order
  fastify.post('/execute', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orderData = validateOrderRequest(request.body) as OrderRequest;
      
      const order: Order = {
        ...orderData,
        orderId: uuidv4(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      await orderRepository.create(order);
      
      // Add to queue for processing
      await addOrderToQueue(order);

      logger.info('Order created', { orderId: order.orderId });

      return reply.code(201).send({
        orderId: order.orderId,
        status: order.status,
        message: 'Order created successfully. Connect to WebSocket for status updates.',
        websocketUrl: `/api/orders/status/${order.orderId}`,
      });

    } catch (error: any) {
      logger.error('Failed to create order', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      return reply.code(500).send({
        error: 'Failed to create order',
        message: error.message,
      });
    }
  });

  // GET /api/orders/:orderId - Get order details
  fastify.get('/:orderId', async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    try {
      const { orderId } = request.params;
      const order = await orderRepository.findById(orderId);

      if (!order) {
        return reply.code(404).send({
          error: 'Order not found',
        });
      }

      return reply.send(order);

    } catch (error: any) {
      logger.error('Failed to fetch order', error);
      return reply.code(500).send({
        error: 'Failed to fetch order',
        message: error.message,
      });
    }
  });

  // GET /api/orders - Get recent orders
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orders = await orderRepository.findRecent(20);
      return reply.send({
        orders,
        count: orders.length,
      });
    } catch (error: any) {
      logger.error('Failed to fetch orders', error);
      return reply.code(500).send({
        error: 'Failed to fetch orders',
        message: error.message,
      });
    }
  });

  // WebSocket route for order status updates
  fastify.get('/status/:orderId', { websocket: true }, (connection: WebSocket, request) => {
    const { orderId } = request.params as { orderId: string };
    
    logger.info('WebSocket connection established', { orderId });

    // Add connection to manager
    wsManager.addConnection(orderId, connection);

    // Send initial status
    orderRepository.findById(orderId).then((order) => {
      if (order) {
        connection.send(JSON.stringify({
          orderId: order.orderId,
          status: order.status,
          timestamp: new Date(),
          message: 'Connected to order status stream',
        }));
      } else {
        connection.send(JSON.stringify({
          orderId,
          status: 'error',
          timestamp: new Date(),
          error: 'Order not found',
        }));
        connection.close();
      }
    }).catch((error) => {
      logger.error('Failed to fetch order for WebSocket', error);
      connection.close();
    });

    connection.on('close', () => {
      wsManager.removeConnection(orderId, connection);
      logger.info('WebSocket connection closed', { orderId });
    });

    connection.on('error', (error: Error) => {
      logger.error('WebSocket error', { orderId, error });
      wsManager.removeConnection(orderId, connection);
    });
  });
}