import { validateOrderRequest } from '../../src/utils/validation';

describe('Order Validation', () => {
  const validOrder = {
    tokenIn: 'So11111111111111111111111111111111111111112',
    tokenOut: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountIn: 1.5,
    slippage: 0.01,
  };

  it('should validate correct order', () => {
    expect(() => validateOrderRequest(validOrder)).not.toThrow();
  });

  it('should reject invalid tokenIn', () => {
    const invalid = { ...validOrder, tokenIn: 'short' };
    expect(() => validateOrderRequest(invalid)).toThrow();
  });

  it('should reject negative amountIn', () => {
    const invalid = { ...validOrder, amountIn: -1 };
    expect(() => validateOrderRequest(invalid)).toThrow();
  });

  it('should reject slippage above 1', () => {
    const invalid = { ...validOrder, slippage: 1.5 };
    expect(() => validateOrderRequest(invalid)).toThrow();
  });

  it('should reject missing fields', () => {
    const invalid = { tokenIn: validOrder.tokenIn };
    expect(() => validateOrderRequest(invalid)).toThrow();
  });
});