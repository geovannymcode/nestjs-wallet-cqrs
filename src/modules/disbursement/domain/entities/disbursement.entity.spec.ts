import { Disbursement } from './disbursement.entity';

describe('Disbursement Entity', () => {
  describe('create', () => {
    it('should create a disbursement with valid data', () => {
      // Arrange
      const validProps = {
        loanId: 'LOAN-123',
        amount: 1000,
        currency: 'USD',
        recipientAccount: '12345678901234567890',
        concept: 'Test disbursement'
      };

      // Act
      const result = Disbursement.create(validProps);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value?.getStatus()).toBe('PENDING');
    });

    it('should fail when amount is below minimum', () => {
      // Arrange
      const props = {
        loanId: 'LOAN-123',
        amount: 50, // Below minimum
        currency: 'USD',
        recipientAccount: '12345678901234567890',
        concept: 'Test'
      };

      // Act
      const result = Disbursement.create(props);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('El monto mínimo es 100');
    });

    it('should fail when amount exceeds maximum', () => {
      // Arrange
      const props = {
        loanId: 'LOAN-123',
        amount: 60000, // Above maximum
        currency: 'USD',
        recipientAccount: '12345678901234567890',
        concept: 'Test'
      };

      // Act
      const result = Disbursement.create(props);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('El monto máximo es 50,000');
    });

    it('should fail with invalid currency', () => {
      // Arrange
      const props = {
        loanId: 'LOAN-123',
        amount: 1000,
        currency: 'EUR', // Not allowed
        recipientAccount: '12345678901234567890',
        concept: 'Test'
      };

      // Act
      const result = Disbursement.create(props);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Moneda no permitida');
    });
  });

  describe('approve', () => {
    it('should approve a pending disbursement', () => {
      // Arrange
      const disbursement = Disbursement.create({
        loanId: 'LOAN-123',
        amount: 1000,
        currency: 'USD',
        recipientAccount: '12345678901234567890',
        concept: 'Test'
      }).value!;

      // Act
      const result = disbursement.approve();

      // Assert
      expect(result.success).toBe(true);
      expect(disbursement.getStatus()).toBe('APPROVED');
    });

    it('should not approve an already approved disbursement', () => {
      // Arrange
      const disbursement = Disbursement.create({
        loanId: 'LOAN-123',
        amount: 1000,
        currency: 'USD',
        recipientAccount: '12345678901234567890',
        concept: 'Test'
      }).value!;
      
      disbursement.approve(); // First approval

      // Act
      const result = disbursement.approve(); // Try to approve again

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Solo se pueden aprobar desembolsos pendientes');
    });
  });
});