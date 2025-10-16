import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function fixTables() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true
  });

  try {
    console.log('📊 Connected to MySQL database');
    console.log('🔧 Running table fixes...\n');
    
    const sql = readFileSync('./fix_missing_tables.sql', 'utf8');
    
    const [results] = await connection.query(sql);
    
    console.log('✅ Tables fixed successfully!');
    console.log('\n📋 Results:');
    
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (result && typeof result === 'object') {
          console.log(`\nQuery ${index + 1}:`, result);
        }
      });
    }
    
    console.log('\n✨ Database is now ready!');
    console.log('   - user_roles table created');
    console.log('   - notification_settings table fixed');
    console.log('   - Default settings added for all users');
    
  } catch (error) {
    console.error('❌ Error fixing tables:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixTables().catch(console.error);
