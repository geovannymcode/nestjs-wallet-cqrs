-- ============================================
-- NestJS Wallet CQRS + Event Sourcing
-- Schema de base de datos
-- ============================================

-- EVENT STORE (Write Side) - Append-only
CREATE TABLE IF NOT EXISTS event_store (
  id              SERIAL PRIMARY KEY,
  aggregate_id    VARCHAR(255) NOT NULL,
  aggregate_type  VARCHAR(100) NOT NULL,
  event_type      VARCHAR(100) NOT NULL,
  event_data      JSONB NOT NULL,
  occurred_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  version         INTEGER NOT NULL,
  UNIQUE(aggregate_id, version)
);

CREATE INDEX IF NOT EXISTS idx_event_store_aggregate
  ON event_store (aggregate_id, version);

-- READ MODELS (Query Side) - Updated async by Event Handlers
CREATE TABLE IF NOT EXISTS wallets_read_model (
  wallet_id   VARCHAR(50) PRIMARY KEY,
  owner_id    VARCHAR(50) NOT NULL,
  balance     DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency    VARCHAR(3) NOT NULL DEFAULT 'USD',
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments_read_model (
  payment_id          VARCHAR(50) PRIMARY KEY,
  wallet_id           VARCHAR(50) NOT NULL,
  amount              DECIMAL(12, 2) NOT NULL,
  currency            VARCHAR(3) NOT NULL,
  recipient_wallet_id VARCHAR(50) NOT NULL,
  concept             TEXT NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_wallet
  ON payments_read_model (wallet_id, created_at DESC);

-- DEMO DATA
INSERT INTO wallets_read_model (wallet_id, owner_id, balance, currency)
VALUES
  ('WAL-001', 'USER-001', 10000.00, 'USD'),
  ('WAL-002', 'USER-002', 5000.00, 'USD'),
  ('WAL-003', 'USER-003', 250.00, 'USD')
ON CONFLICT (wallet_id) DO NOTHING;
