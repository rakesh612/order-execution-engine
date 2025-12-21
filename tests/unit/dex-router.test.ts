import { DexRouter } from '../../src/services/dex-router';

describe('DexRouter', () => {
  let router: DexRouter;

  beforeEach(() => {
    router = new DexRouter();
  });

  describe('getRaydiumQuote', () => {
    it('should return a valid quote', async () => {
      const quote = await router.getRaydiumQuote('tokenA', 'tokenB', 10);
      
      expect(quote).toHaveProperty('dex', 'raydium');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('fee', 0.003);
      expect(quote).toHaveProperty('estimatedOutput');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.estimatedOutput).toBeGreaterThan(0);
    });
  });

  describe('getMeteorQuote', () => {
    it('should return a valid quote', async () => {
      const quote = await router.getMeteorQuote('tokenA', 'tokenB', 10);
      
      expect(quote).toHaveProperty('dex', 'meteora');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('fee', 0.002);
      expect(quote).toHaveProperty('estimatedOutput');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.estimatedOutput).toBeGreaterThan(0);
    });
  });

  describe('getBestQuote', () => {
    it('should select the quote with highest estimated output', async () => {
      const bestQuote = await router.getBestQuote('tokenA', 'tokenB', 10);
      
      expect(bestQuote).toHaveProperty('dex');
      expect(['raydium', 'meteora']).toContain(bestQuote.dex);
      expect(bestQuote.estimatedOutput).toBeGreaterThan(0);
    });

    it('should call both DEXs', async () => {
      const raydiumSpy = jest.spyOn(router, 'getRaydiumQuote');
      const meteoraSpy = jest.spyOn(router, 'getMeteorQuote');
      
      await router.getBestQuote('tokenA', 'tokenB', 10);
      
      expect(raydiumSpy).toHaveBeenCalledTimes(1);
      expect(meteoraSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeSwap', () => {
    it('should successfully execute swap', async () => {
      const result = await router.executeSwap('raydium', 'tokenA', 'tokenB', 10, 0.01);
      
      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('executedPrice');
      expect(result).toHaveProperty('amountOut');
      expect(result.txHash).toHaveLength(88);
      expect(result.executedPrice).toBeGreaterThan(0);
      expect(result.amountOut).toBeGreaterThan(0);
    });
  });
});