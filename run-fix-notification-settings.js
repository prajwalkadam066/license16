// Script to fix notification_settings table in MySQL database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function fixNotificationSettings() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true
  });

  try {
    console.log('📦 Connecting to MySQL database...');
    
    // Read the SQL file
    const sql = readFileSync('./fix_notification_settings.sql', 'utf8');
    
    console.log('🔧 Running notification_settings table fix...');
    
    // Execute the SQL
    await connection.query(sql);
    
    console.log('✅ Successfully fixed notification_settings table!');
    
    // Verify the table structure
    const [rows] = await connection.query('DESCRIBE notification_settings');
    console.log('\n📋 Table structure:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Error fixing notification_settings table:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixNotificationSettings().catch(console.error);
