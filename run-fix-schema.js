import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function fixSchema() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true
  });

  try {
    console.log('📊 Connected to MySQL database');
    console.log('🔧 Fixing notification_settings schema...\n');
    
    const sql = readFileSync('./fix_notification_schema.sql', 'utf8');
    
    await connection.query(sql);
    
    console.log('✅ Schema fixed successfully!');
    console.log('   - notification_settings table recreated');
    console.log('   - Correct column names applied');
    console.log('   - Default settings added for all users');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixSchema().catch(console.error);
