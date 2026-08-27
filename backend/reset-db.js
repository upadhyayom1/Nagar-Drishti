const { Client } = require('pg');
const { env } = require('./src/config/env');

async function resetDb() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to database. Dropping schema public...');
    
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log('Schema dropped and recreated successfully.');
  } catch (error) {
    console.error('Failed to reset database:', error);
  } finally {
    await client.end();
  }
}

resetDb();
