import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixNotificationSchema() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('Connected to MySQL database');
    console.log(`Database: ${process.env.MYSQL_DATABASE} at ${process.env.MYSQL_HOST}`);

    // Drop the existing notification_settings table
    console.log('\n🔧 Dropping existing notification_settings table...');
    await connection.execute('DROP TABLE IF EXISTS notification_settings');
    console.log('✅ Dropped notification_settings table');

    // Create the notification_settings table with correct column names
    console.log('\n🔧 Creating notification_settings table with correct schema...');
    await connection.execute(`
      CREATE TABLE notification_settings (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id CHAR(36) UNIQUE,
        email_notifications_enabled BOOLEAN DEFAULT TRUE,
        notify_45_days BOOLEAN DEFAULT TRUE,
        notify_30_days BOOLEAN DEFAULT TRUE,
        notify_15_days BOOLEAN DEFAULT TRUE,
        notify_7_days BOOLEAN DEFAULT TRUE,
        notify_5_days BOOLEAN DEFAULT TRUE,
        notify_1_day BOOLEAN DEFAULT TRUE,
        notify_0_days BOOLEAN DEFAULT TRUE,
        notification_time TIME DEFAULT '09:00:00',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notification_settings_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created notification_settings table');

    // Verify the table structure
    console.log('\n🔍 Verifying table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notification_settings'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);

    console.log('\n📋 Notification Settings Table Columns:');
    console.table(columns);

    console.log('\n✅ Database schema fixed successfully!');
    console.log('🔄 Please restart the Server workflow to apply changes.');

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixNotificationSchema().catch(console.error);
