export type OrderStatus = 
  | 'pending' 
  | 'routing' 
  | 'building' 
  | 'submitted' 
  | 'confirmed' 
  | 'failed';

export type DexType = 'raydium' | 'meteora';

export interface OrderRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage: number;
}

export interface Order extends OrderRequest {
  orderId: string;
  status: OrderStatus;
  selectedDex?: DexType;
  executedPrice?: number;
  txHash?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DexQuote {
  dex: DexType;
  price: number;
  fee: number;
  estimatedOutput: number;
}

export interface ExecutionResult {
  txHash: string;
  executedPrice: number;
  amountOut: number;
  dex: DexType;
}

export interface StatusUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: Date;
  dex?: DexType;
  txHash?: string;
  error?: string;
  executedPrice?: number;
  message?: string;
}