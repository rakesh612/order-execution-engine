import { orderRepository } from '../../src/database/repositories/order.repository';
import { Order } from '../../src/types/order.types';
import { v4 as uuidv4 } from 'uuid';

describe('Order Flow Integration', () => {
  const testOrder: Order = {
    orderId: uuidv4(),
    tokenIn: 'So11111111111111111111111111111111111111112',
    tokenOut: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountIn: 1.5,
    slippage: 0.01,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should create order in database', async () => {
    const created = await orderRepository.create(testOrder);
    expect(created.orderId).toBe(testOrder.orderId);
    expect(created.status).toBe('pending');
  });

  it('should update order status', async () => {
    await orderRepository.create(testOrder);
    const updated = await orderRepository.updateStatus(testOrder.orderId, 'confirmed');
    expect(updated?.status).toBe('confirmed');
  });

  it('should find order by id', async () => {
    await orderRepository.create(testOrder);
    const found = await orderRepository.findById(testOrder.orderId);
    expect(found).not.toBeNull();
    expect(found?.orderId).toBe(testOrder.orderId);
  });
});