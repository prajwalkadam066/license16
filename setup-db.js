import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: 3306,
    multipleStatements: true
  });

  try {
    console.log('✅ Connected to MySQL database');
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Current tables:');
    if (tables.length === 0) {
      console.log('  No tables found. Setting up database...\n');
      
      // Read and execute the SQL setup file
      const sqlScript = readFileSync('setup_mysql_database.sql', 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = sqlScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
            console.log('✅ Executed:', statement.substring(0, 60) + '...');
          } catch (err) {
            if (!err.message.includes('already exists')) {
              console.error('❌ Error:', err.message);
            }
          }
        }
      }
      
      // Check tables again
      const [newTables] = await connection.execute('SHOW TABLES');
      console.log('\n📋 Tables created:');
      newTables.forEach(table => console.log('  -', Object.values(table)[0]));
    } else {
      console.log('✅ Database already has tables:');
      tables.forEach(table => console.log('  -', Object.values(table)[0]));
    }
    
    // Check if currencies table has data
    try {
      const [currencies] = await connection.execute('SELECT COUNT(*) as count FROM currencies');
      if (currencies[0].count === 0) {
        console.log('\n💰 Adding default currencies...');
        await connection.execute(`
          INSERT INTO currencies (id, code, name, symbol, exchange_rate_to_inr, is_default) VALUES 
          (UUID(), 'INR', 'Indian Rupee', '₹', 1.0000, TRUE),
          (UUID(), 'USD', 'US Dollar', '$', 83.5000, FALSE),
          (UUID(), 'EUR', 'Euro', '€', 90.5000, FALSE),
          (UUID(), 'GBP', 'British Pound', '£', 105.0000, FALSE)
        `);
        console.log('✅ Default currencies added');
      }
    } catch (err) {
      console.error('Error checking currencies:', err.message);
    }
    
    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await connection.end();
  }
}

setupDatabase();
