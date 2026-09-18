const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('✓ Database schema created successfully');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase();
