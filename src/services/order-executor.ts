import { Order, OrderStatus, StatusUpdate } from '../types/order.types';
import { dexRouter } from './dex-router';
import { orderRepository } from '../database/repositories/order.repository';
import { wsManager } from '../utils/websocket-manager';
import { logger } from '../utils/logger';
import { config } from '../config';

export class OrderExecutor {
  private emitStatus(order: Order, status: OrderStatus, additionalData?: Partial<StatusUpdate>) {
    const update: StatusUpdate = {
      orderId: order.orderId,
      status,
      timestamp: new Date(),
      ...additionalData,
    };

    wsManager.broadcast(order.orderId, update);
  }

  async executeOrder(order: Order): Promise<void> {
    logger.info('Starting order execution', { orderId: order.orderId });

    try {
      // Step 1: Pending
      await orderRepository.updateStatus(order.orderId, 'pending');
      this.emitStatus(order, 'pending', { message: 'Order received and queued' });

      // Step 2: Routing - Compare DEX prices
      await orderRepository.updateStatus(order.orderId, 'routing');
      this.emitStatus(order, 'routing', { message: 'Comparing DEX prices' });

      const bestQuote = await dexRouter.getBestQuote(
        order.tokenIn,
        order.tokenOut,
        order.amountIn
      );

      // Step 3: Building - Create transaction
      await orderRepository.updateStatus(order.orderId, 'building', {
        selectedDex: bestQuote.dex,
      });
      this.emitStatus(order, 'building', {
        dex: bestQuote.dex,
        message: `Building transaction on ${bestQuote.dex}`,
      });

      // Step 4: Submitted - Execute swap
      await orderRepository.updateStatus(order.orderId, 'submitted', {
        selectedDex: bestQuote.dex,
      });
      this.emitStatus(order, 'submitted', {
        dex: bestQuote.dex,
        message: 'Transaction submitted to network',
      });

      const result = await dexRouter.executeSwap(
        bestQuote.dex,
        order.tokenIn,
        order.tokenOut,
        order.amountIn,
        order.slippage
      );

      // Step 5: Confirmed - Success
      await orderRepository.updateStatus(order.orderId, 'confirmed', {
        selectedDex: bestQuote.dex,
        executedPrice: result.executedPrice,
        txHash: result.txHash,
      });
      
      this.emitStatus(order, 'confirmed', {
        dex: bestQuote.dex,
        txHash: result.txHash,
        executedPrice: result.executedPrice,
        message: 'Transaction confirmed successfully',
      });

      logger.info('Order executed successfully', {
        orderId: order.orderId,
        dex: bestQuote.dex,
        txHash: result.txHash,
      });

    } catch (error: any) {
      logger.error('Order execution failed', {
        orderId: order.orderId,
        error: error.message,
      });

      await orderRepository.updateStatus(order.orderId, 'failed', {
        error: error.message,
      });

      this.emitStatus(order, 'failed', {
        error: error.message,
        message: `Execution failed: ${error.message}`,
      });

      throw error;
    }
  }

  async executeWithRetry(order: Order, attempt: number = 1): Promise<void> {
    try {
      await this.executeOrder(order);
    } catch (error: any) {
      if (attempt < config.execution.maxRetries) {
        const delay = config.execution.retryDelayMs * Math.pow(2, attempt - 1);
        logger.info(`Retrying order execution (attempt ${attempt + 1}/${config.execution.maxRetries})`, {
          orderId: order.orderId,
          delayMs: delay,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        await this.executeWithRetry(order, attempt + 1);
      } else {
        logger.error('Order execution failed after max retries', {
          orderId: order.orderId,
          attempts: config.execution.maxRetries,
        });
        
        await orderRepository.updateStatus(order.orderId, 'failed', {
          error: `Failed after ${config.execution.maxRetries} attempts: ${error.message}`,
        });
      }
    }
  }
}

export const orderExecutor = new OrderExecutor();