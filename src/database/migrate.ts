import { pool } from './client';
import { logger } from '../utils/logger';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(36) PRIMARY KEY,
    token_in VARCHAR(44) NOT NULL,
    token_out VARCHAR(44) NOT NULL,
    amount_in DECIMAL(20, 9) NOT NULL,
    slippage DECIMAL(5, 4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    selected_dex VARCHAR(20),
    executed_price DECIMAL(20, 9),
    tx_hash VARCHAR(88),
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_orders_tx_hash ON orders(tx_hash) WHERE tx_hash IS NOT NULL;
  `,
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < migrations.length; i++) {
      await client.query(migrations[i]);
      logger.info(`Migration ${i + 1}/${migrations.length} completed`);
    }
    
    await client.query('COMMIT');
    logger.info('All migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
// Since this is run via 'tsx src/database/migrate.ts', we check if migrate is in the script path
if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(() => {
      logger.info('Migration script finished');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration script failed', err);
      process.exit(1);
    });
}

export { runMigrations };