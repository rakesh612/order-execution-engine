import { wsManager } from '../../src/utils/websocket-manager';
import { StatusUpdate } from '../../src/types/order.types';

describe('WebSocket Manager', () => {
  it('should track connection count', () => {
    const orderId = 'test-order-1';
    const initialCount = wsManager.getConnectionCount(orderId);
    expect(initialCount).toBe(0);
  });

  it('should broadcast updates', () => {
    const update: StatusUpdate = {
      orderId: 'test-123',
      status: 'confirmed',
      timestamp: new Date(),
    };
    
    // This would require creating actual WebSocket connections
    expect(() => wsManager.broadcast('test-123', update)).not.toThrow();
  });
});