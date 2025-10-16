import mysql from 'mysql2/promise';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function fixNotificationTables() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL database');

    // Read SQL file
    const sql = fs.readFileSync('fix_notification_tables.sql', 'utf8');
    
    // Execute SQL
    console.log('📝 Executing migration...');
    const [results] = await connection.query(sql);
    console.log('✅ Migration completed successfully');
    
    // Verify tables exist
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('notification_settings', 'email_notifications')
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('\n📊 Created tables:');
    tables.forEach(table => console.log(`  - ${table.TABLE_NAME}`));
    
    // Check notification settings
    const [settings] = await connection.query('SELECT COUNT(*) as count FROM notification_settings');
    console.log(`\n✅ Notification settings created for ${settings[0].count} user(s)`);
    
    // Verify email_enabled is TRUE
    const [enabledSettings] = await connection.query('SELECT COUNT(*) as count FROM notification_settings WHERE email_enabled = TRUE');
    console.log(`✅ Email notifications enabled for ${enabledSettings[0].count} user(s)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

fixNotificationTables();
