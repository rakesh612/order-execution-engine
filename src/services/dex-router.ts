import { DexQuote, DexType } from '../types/order.types';
import { logger } from '../utils/logger';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateMockTxHash(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 88; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

export class DexRouter {
  private basePrice: number = 100; // Base price for mocking

  async getRaydiumQuote(
    tokenIn: string, 
    tokenOut: string, 
    amountIn: number
  ): Promise<DexQuote> {
    // Simulate network delay
    await sleep(150 + Math.random() * 100);
    
    // Price with 2-4% variance
    const price = this.basePrice * (0.98 + Math.random() * 0.04);
    const fee = 0.003; // 0.3% fee
    const estimatedOutput = (amountIn * price) * (1 - fee);

    logger.debug('Raydium quote:', { tokenIn, tokenOut, amountIn, price, estimatedOutput });

    return {
      dex: 'raydium',
      price,
      fee,
      estimatedOutput,
    };
  }

  async getMeteorQuote(
    tokenIn: string, 
    tokenOut: string, 
    amountIn: number
  ): Promise<DexQuote> {
    // Simulate network delay
    await sleep(150 + Math.random() * 100);
    
    // Price with 3-5% variance (slightly different range)
    const price = this.basePrice * (0.97 + Math.random() * 0.05);
    const fee = 0.002; // 0.2% fee (lower than Raydium)
    const estimatedOutput = (amountIn * price) * (1 - fee);

    logger.debug('Meteora quote:', { tokenIn, tokenOut, amountIn, price, estimatedOutput });

    return {
      dex: 'meteora',
      price,
      fee,
      estimatedOutput,
    };
  }

  async getBestQuote(
    tokenIn: string, 
    tokenOut: string, 
    amountIn: number
  ): Promise<DexQuote> {
    logger.info('Fetching quotes from DEXs', { tokenIn, tokenOut, amountIn });

    // Fetch quotes from both DEXs in parallel
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amountIn),
      this.getMeteorQuote(tokenIn, tokenOut, amountIn),
    ]);

    // Select best quote based on estimated output
    const bestQuote = raydiumQuote.estimatedOutput > meteoraQuote.estimatedOutput 
      ? raydiumQuote 
      : meteoraQuote;

    logger.info('Best quote selected', {
      selectedDex: bestQuote.dex,
      raydiumOutput: raydiumQuote.estimatedOutput,
      meteoraOutput: meteoraQuote.estimatedOutput,
      improvement: Math.abs(raydiumQuote.estimatedOutput - meteoraQuote.estimatedOutput).toFixed(4),
    });

    return bestQuote;
  }

  async executeSwap(
    dex: DexType,
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    slippage: number
  ): Promise<{ txHash: string; executedPrice: number; amountOut: number }> {
    logger.info('Executing swap', { dex, tokenIn, tokenOut, amountIn, slippage });

    // Simulate transaction building and execution (2-3 seconds)
    await sleep(2000 + Math.random() * 1000);

    // Simulate 1% chance of failure
    if (Math.random() < 0.01) {
      throw new Error(`${dex} execution failed: Insufficient liquidity`);
    }

    const executedPrice = this.basePrice * (0.99 + Math.random() * 0.02);
    const amountOut = amountIn * executedPrice * (1 - slippage);
    const txHash = generateMockTxHash();

    logger.info('Swap executed successfully', { dex, txHash, executedPrice, amountOut });

    return {
      txHash,
      executedPrice,
      amountOut,
    };
  }
}

export const dexRouter = new DexRouter();