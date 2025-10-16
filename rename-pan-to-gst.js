import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function renamePanToGst() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    console.log('Connected to MySQL database');
    console.log(`Database: ${process.env.MYSQL_DATABASE} at ${process.env.MYSQL_HOST}\n`);

    // Rename 'pan' to 'gst' in clients table
    console.log('🔧 Renaming pan to gst in clients table...');
    await connection.execute(`
      ALTER TABLE clients 
      CHANGE COLUMN pan gst VARCHAR(15)
    `);
    console.log('✅ Renamed pan to gst in clients table');

    // Drop old index and create new one for clients
    console.log('🔧 Updating index in clients table...');
    await connection.execute('ALTER TABLE clients DROP INDEX IF EXISTS idx_clients_pan');
    await connection.execute('ALTER TABLE clients ADD INDEX idx_clients_gst (gst)');
    console.log('✅ Updated index in clients table');

    // Rename 'pan' to 'gst' in vendors table
    console.log('🔧 Renaming pan to gst in vendors table...');
    await connection.execute(`
      ALTER TABLE vendors 
      CHANGE COLUMN pan gst VARCHAR(15)
    `);
    console.log('✅ Renamed pan to gst in vendors table');

    // Drop old index and create new one for vendors
    console.log('🔧 Updating index in vendors table...');
    await connection.execute('ALTER TABLE vendors DROP INDEX IF EXISTS idx_vendors_pan');
    await connection.execute('ALTER TABLE vendors ADD INDEX idx_vendors_gst (gst)');
    console.log('✅ Updated index in vendors table');

    // Rename 'pan' to 'gst' in license_purchases table (if exists)
    console.log('🔧 Renaming pan to gst in license_purchases table...');
    await connection.execute(`
      ALTER TABLE license_purchases 
      CHANGE COLUMN pan gst VARCHAR(15)
    `);
    console.log('✅ Renamed pan to gst in license_purchases table');

    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    
    const [clientsCols] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'gst'
    `, [process.env.MYSQL_DATABASE]);
    
    const [vendorsCols] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'gst'
    `, [process.env.MYSQL_DATABASE]);

    console.log('\n✅ Database schema updated successfully!');
    console.log('\nClients table gst column:');
    console.table(clientsCols);
    console.log('\nVendors table gst column:');
    console.table(vendorsCols);
    
    console.log('\n🔄 Please update the backend and frontend code to use "gst" instead of "pan"');

  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('\n🔌 Database connection closed');
  }
}

renamePanToGst().catch(console.error);
