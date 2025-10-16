import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupCurrenciesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log('✅ Connected to MySQL database');

    // Check if currencies table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'currencies'");
    
    if (tables.length === 0) {
      console.log('📝 Creating currencies table...');
      
      // Create currencies table
      await connection.query(`
        CREATE TABLE currencies (
          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
          code VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          symbol VARCHAR(10) NOT NULL,
          exchange_rate_to_inr DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_currencies_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Currencies table created');
      
      // Insert default currencies
      console.log('📝 Inserting default currency data...');
      
      await connection.query(`
        INSERT INTO currencies (id, code, name, symbol, exchange_rate_to_inr, is_default) VALUES 
        (UUID(), 'INR', 'Indian Rupee', '₹', 1.0000, TRUE),
        (UUID(), 'USD', 'US Dollar', '$', 83.1200, FALSE),
        (UUID(), 'EUR', 'Euro', '€', 90.3400, FALSE),
        (UUID(), 'GBP', 'British Pound', '£', 105.6700, FALSE)
      `);
      
      console.log('✅ Default currencies inserted');
    } else {
      console.log('ℹ️  Currencies table already exists');
      
      // Check if there's any data
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM currencies');
      const count = rows[0].count;
      
      if (count === 0) {
        console.log('📝 Inserting default currency data...');
        
        await connection.query(`
          INSERT INTO currencies (id, code, name, symbol, exchange_rate_to_inr, is_default) VALUES 
          (UUID(), 'INR', 'Indian Rupee', '₹', 1.0000, TRUE),
          (UUID(), 'USD', 'US Dollar', '$', 83.1200, FALSE),
          (UUID(), 'EUR', 'Euro', '€', 90.3400, FALSE),
          (UUID(), 'GBP', 'British Pound', '£', 105.6700, FALSE)
        `);
        
        console.log('✅ Default currencies inserted');
      } else {
        console.log(`ℹ️  Found ${count} currencies in the database`);
      }
    }

    // Display current currencies
    const [currencies] = await connection.query('SELECT * FROM currencies ORDER BY is_default DESC, code ASC');
    console.log('\n📊 Current currencies:');
    console.table(currencies);

    await connection.end();
    console.log('\n✨ Setup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupCurrenciesTable();
