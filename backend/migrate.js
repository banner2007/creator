import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

export async function runMigration() {
  const dbUrl = process.env.DATABASE_URL || 
    (process.env.SUPABASE_DB_PASSWORD ? 
      `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.wfvbggdmjerjbqnpquqa.supabase.co:5432/postgres` : 
      null);

  if (!dbUrl) {
    console.log('[Migration] Skipping auto-migration: No DATABASE_URL or SUPABASE_DB_PASSWORD configured in environment.');
    console.log('[Migration] If you experience errors saving new settings, please run this query in your Supabase SQL Editor:');
    console.log(`
      ALTER TABLE public.landing_pages 
      ADD COLUMN IF NOT EXISTS lazy_load BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS masking BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS custom_css TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT '573242035307',
      ADD COLUMN IF NOT EXISTS whatsapp_text TEXT DEFAULT 'Hola, quiero información sobre este producto.',
      ADD COLUMN IF NOT EXISTS whatsapp_active BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS floating_cta_text TEXT DEFAULT '¡PEDIR CON DESCUENTO!',
      ADD COLUMN IF NOT EXISTS floating_cta_active BOOLEAN DEFAULT true NOT NULL;
    `);
    return;
  }

  console.log('[Migration] Attempting to run database migration...');
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('[Migration] Connected to database.');
    
    const query = `
      ALTER TABLE public.landing_pages 
      ADD COLUMN IF NOT EXISTS lazy_load BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS masking BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS custom_css TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT '573242035307',
      ADD COLUMN IF NOT EXISTS whatsapp_text TEXT DEFAULT 'Hola, quiero información sobre este producto.',
      ADD COLUMN IF NOT EXISTS whatsapp_active BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS floating_cta_text TEXT DEFAULT '¡PEDIR CON DESCUENTO!',
      ADD COLUMN IF NOT EXISTS floating_cta_active BOOLEAN DEFAULT true NOT NULL;
    `;
    
    await client.query(query);
    console.log('[Migration] Database schema updated successfully.');
  } catch (err) {
    console.error('[Migration] Migration failed:', err.message);
    console.log('[Migration] Please execute the following SQL in your Supabase SQL editor:');
    console.log(`
      ALTER TABLE public.landing_pages 
      ADD COLUMN IF NOT EXISTS lazy_load BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS masking BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS custom_css TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT DEFAULT '573242035307',
      ADD COLUMN IF NOT EXISTS whatsapp_text TEXT DEFAULT 'Hola, quiero información sobre este producto.',
      ADD COLUMN IF NOT EXISTS whatsapp_active BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS floating_cta_text TEXT DEFAULT '¡PEDIR CON DESCUENTO!',
      ADD COLUMN IF NOT EXISTS floating_cta_active BOOLEAN DEFAULT true NOT NULL;
    `);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}
