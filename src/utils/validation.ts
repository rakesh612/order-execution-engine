import { z } from 'zod';

export const orderRequestSchema = z.object({
  tokenIn: z.string().min(32).max(44),
  tokenOut: z.string().min(32).max(44),
  amountIn: z.number().positive().max(1000000),
  slippage: z.number().min(0).max(1),
});

export function validateOrderRequest(data: unknown) {
  return orderRequestSchema.parse(data);
}