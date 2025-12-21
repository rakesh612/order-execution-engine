import { pool } from '../client';
import { Order, OrderStatus } from '../../types/order.types';
import { logger } from '../../utils/logger';

export class OrderRepository {
  async create(order: Order): Promise<Order> {
    const query = `
      INSERT INTO orders (
        order_id, token_in, token_out, amount_in, slippage, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      order.orderId,
      order.tokenIn,
      order.tokenOut,
      order.amountIn,
      order.slippage,
      order.status,
      order.createdAt,
      order.updatedAt,
    ];

    try {
      const result = await pool.query(query, values);
      return this.mapRowToOrder(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create order', error);
      throw error;
    }
  }

  async updateStatus(
    orderId: string, 
    status: OrderStatus, 
    data?: Partial<Order>
  ): Promise<Order | null> {
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [orderId, status];
    let paramIndex = 3;

    if (data?.selectedDex) {
      updates.push(`selected_dex = $${paramIndex++}`);
      values.push(data.selectedDex);
    }
    if (data?.executedPrice !== undefined) {
      updates.push(`executed_price = $${paramIndex++}`);
      values.push(data.executedPrice);
    }
    if (data?.txHash) {
      updates.push(`tx_hash = $${paramIndex++}`);
      values.push(data.txHash);
    }
    if (data?.error) {
      updates.push(`error = $${paramIndex++}`);
      values.push(data.error);
    }

    const query = `
      UPDATE orders 
      SET ${updates.join(', ')}
      WHERE order_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0] ? this.mapRowToOrder(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to update order status', error);
      throw error;
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    const query = 'SELECT * FROM orders WHERE order_id = $1';
    
    try {
      const result = await pool.query(query, [orderId]);
      return result.rows[0] ? this.mapRowToOrder(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find order', error);
      throw error;
    }
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const query = 'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC';
    
    try {
      const result = await pool.query(query, [status]);
      return result.rows.map(row => this.mapRowToOrder(row));
    } catch (error) {
      logger.error('Failed to find orders by status', error);
      throw error;
    }
  }

  async findRecent(limit: number = 10): Promise<Order[]> {
    const query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1';
    
    try {
      const result = await pool.query(query, [limit]);
      return result.rows.map(row => this.mapRowToOrder(row));
    } catch (error) {
      logger.error('Failed to find recent orders', error);
      throw error;
    }
  }

  private mapRowToOrder(row: any): Order {
    return {
      orderId: row.order_id,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      amountIn: parseFloat(row.amount_in),
      slippage: parseFloat(row.slippage),
      status: row.status,
      selectedDex: row.selected_dex,
      executedPrice: row.executed_price ? parseFloat(row.executed_price) : undefined,
      txHash: row.tx_hash,
      error: row.error,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const orderRepository = new OrderRepository();