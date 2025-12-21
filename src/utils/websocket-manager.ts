import { WebSocket } from 'ws';
import { StatusUpdate } from '../types/order.types';
import { logger } from './logger';

class WebSocketManager {
  private connections: Map<string, Set<WebSocket>> = new Map();

  addConnection(orderId: string, ws: WebSocket) {
    if (!this.connections.has(orderId)) {
      this.connections.set(orderId, new Set());
    }
    this.connections.get(orderId)!.add(ws);
    logger.debug(`WebSocket connected for order ${orderId}`);
  }

  removeConnection(orderId: string, ws: WebSocket) {
    const connections = this.connections.get(orderId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.connections.delete(orderId);
      }
    }
    logger.debug(`WebSocket disconnected for order ${orderId}`);
  }

  broadcast(orderId: string, update: StatusUpdate) {
    const connections = this.connections.get(orderId);
    if (connections) {
      const message = JSON.stringify(update);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
      logger.debug(`Broadcasted update for order ${orderId}:`, update.status);
    }
  }

  getConnectionCount(orderId: string): number {
    return this.connections.get(orderId)?.size || 0;
  }
}

export const wsManager = new WebSocketManager();