import fs from 'fs';
import path from 'path';
import { query } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migrationsDir = path.join(path.resolve(), 'migrations');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Reintenta una operación con backoff exponencial
// Útil para Neon free tier que puede tardar en "despertar" del auto-suspend
async function withRetry(fn, retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isTransient = err.message.includes('Control plane') ||
                          err.message.includes('ECONNREFUSED') ||
                          err.message.includes('ETIMEDOUT') ||
                          err.message.includes('terminating connection');
      if (!isTransient || attempt === retries) throw err;
      console.log(`  ⏳ Reintento ${attempt}/${retries} en ${delayMs}ms... (${err.message})`);
      await sleep(delayMs);
      delayMs *= 2;
    }
  }
}

async function runMigrations() {
  try {
    // Wakeup: una query simple para despertar Neon antes de empezar
    console.log('🔌 Conectando a la base de datos...');
    await withRetry(() => query('SELECT 1'));
    console.log('✅ Base de datos lista\n');

    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Running migration: ${file}`);

        const statements = sql.split(';').filter(stmt => stmt.trim());

        for (const stmt of statements) {
          if (stmt.trim()) {
            try {
              await withRetry(() => query(stmt), 3, 1500);
            } catch (err) {
              const errorMsg = err.message.toLowerCase();
              if (errorMsg.includes('already exists') ||
                  errorMsg.includes('duplicate') ||
                  errorMsg.includes('constraint') ||
                  errorMsg.includes('no existe') ||
                  errorMsg.includes('does not exist') ||
                  errorMsg.includes('ya existe') ||
                  errorMsg.includes('column') ||
                  errorMsg.includes('único') ||
                  errorMsg.includes('índice')) {
                console.log(`  ⚠️  Skipped: ${stmt.slice(0, 60).trim()}...`);
              } else {
                throw err;
              }
            }
          }
        }

        console.log(`✅ Completed: ${file}`);
      }
    }

    console.log('\n✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();
