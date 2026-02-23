import { Wallet } from './wallet.entity';

describe('Wallet Entity', () => {
  const validProps = {
    walletId: 'WAL-001',
    ownerId: 'USER-001',
    balance: 10_000,
    currency: 'USD',
  };

  describe('create', () => {
    it('should create a valid wallet', () => {
      const result = Wallet.create(validProps);
      expect(result.success).toBe(true);
      expect(result.value?.getBalance()).toBe(10_000);
    });

    it('should fail with negative balance', () => {
      const result = Wallet.create({ ...validProps, balance: -100 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('negativo');
    });
  });

  describe('canProcessPayment', () => {
    it('should allow payment with sufficient funds', () => {
      const wallet = Wallet.create(validProps).value!;
      const result = wallet.canProcessPayment(5_000);
      expect(result.success).toBe(true);
    });

    it('should reject payment with insufficient funds', () => {
      const wallet = Wallet.create(validProps).value!;
      const result = wallet.canProcessPayment(15_000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Fondos insuficientes');
    });

    it('should reject zero amount', () => {
      const wallet = Wallet.create(validProps).value!;
      const result = wallet.canProcessPayment(0);
      expect(result.success).toBe(false);
    });

    it('should reject amount above maximum', () => {
      const wallet = Wallet.create(validProps).value!;
      const result = wallet.canProcessPayment(60_000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('50,000');
    });
  });

  describe('calculateNewBalance', () => {
    it('should return correct new balance', () => {
      const wallet = Wallet.create(validProps).value!;
      expect(wallet.calculateNewBalance(3_000)).toBe(7_000);
    });
  });
});
