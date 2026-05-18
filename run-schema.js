const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    
    // First drop the existing database to start fresh
    console.log('Dropping old database if exists...');
    await connection.query('DROP DATABASE IF EXISTS lab_booking_system');
    
    console.log('Running new schema...');
    await connection.query(schemaSql);
    
    console.log('✅ Schema executed successfully!');
  } catch (error) {
    console.error('❌ Error executing schema:', error);
  } finally {
    await connection.end();
  }
}

runSchema();
