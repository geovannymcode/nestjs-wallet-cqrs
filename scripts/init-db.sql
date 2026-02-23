-- Crear tabla de desembolsos
CREATE TABLE IF NOT EXISTS disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  recipient_account VARCHAR(20) NOT NULL,
  concept TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de ejemplo
INSERT INTO disbursements (loan_id, amount, currency, recipient_account, concept, status) VALUES
('LOAN-DEMO01', 5000, 'USD', '11111111111111111111', 'Préstamo personal - Demo', 'PENDING'),
('LOAN-DEMO02', 15000, 'USD', '22222222222222222222', 'Capital de trabajo - Demo', 'APPROVED');