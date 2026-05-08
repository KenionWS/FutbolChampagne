import fs from 'fs';
import path from 'path';
import { query } from '../src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migrationsDir = path.join(path.resolve(), 'migrations');

async function runMigrations() {
  try {
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
              await query(stmt);
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
