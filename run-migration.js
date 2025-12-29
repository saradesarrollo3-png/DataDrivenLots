
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = readFileSync('./migrations/0006_add_tx_hash_to_traceability.sql', 'utf-8');

try {
  await pool.query(sql);
  console.log('✅ Migración ejecutada correctamente');
  await pool.end();
} catch (error) {
  console.error('❌ Error al ejecutar la migración:', error);
  await pool.end();
  process.exit(1);
}
