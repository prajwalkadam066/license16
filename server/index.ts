//  .ts
import express from 'express';
import cors from 'cors';

import mysql from 'mysql2/promise';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';
import dotenv from "dotenv";
import { EmailScheduler } from './emailScheduler';
import emailNotificationsRouter from './routes/emailNotifications';
dotenv.config();

// Global email scheduler instance
let globalEmailScheduler: EmailScheduler | null = null;

// Exchange rates cache
let exchangeRates: { [key: string]: number } = { INR: 1, USD: 83, AED: 3.67 };
let lastRateUpdate = 0;

// Fetch and cache exchange rates
async function fetchExchangeRates() {
  const now = Date.now();
  // Update rates every 1 hour
  if (now - lastRateUpdate < 3600000 && Object.keys(exchangeRates).length > 2) {
    return exchangeRates;
  }

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json() as any;
    
    if (data && data.rates) {
      exchangeRates = {
        USD: 1,
        INR: data.rates.INR || 83,
        AED: data.rates.AED || 3.67,
      };
      lastRateUpdate = now;
      console.log('✅ Exchange rates updated:', exchangeRates);
    }
  } catch (error) {
    console.warn('⚠️  Failed to fetch exchange rates, using cached values:', error);
  }
  
  return exchangeRates;
}

// Calculate INR value from any currency
function calculateINR(amount: number, currency: string): number {
  if (!currency || currency === 'INR') return amount;
  
  const currencyUpper = currency.toUpperCase();
  
  if (currencyUpper === 'USD') {
    return amount * exchangeRates.INR; // USD to INR
  } else if (currencyUpper === 'AED') {
    // AED to USD to INR
    const usdAmount = amount / exchangeRates.AED;
    return usdAmount * exchangeRates.INR;
  }
  
  // Default: assume USD
  return amount * exchangeRates.INR;
}

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ?? true, // set FRONTEND_ORIGIN in production
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email notifications routes (using Replit Mail)
app.use('/api/notifications', emailNotificationsRouter);

// MySQL Database configuration
let pool: mysql.Pool | null = null;
let dbAvailable = false;

async function initDatabase() {
  const MYSQL_HOST = process.env.MYSQL_HOST;
  const MYSQL_USER = process.env.MYSQL_USER;
  const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
  const MYSQL_DATABASE = process.env.MYSQL_DATABASE;

  if (MYSQL_HOST && MYSQL_USER && MYSQL_PASSWORD && MYSQL_DATABASE) {
    try {
      pool = mysql.createPool({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      // Test connection
      const connection = await pool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      
      dbAvailable = true;
      console.log('✅ Connected to MySQL database');
      console.log(`📍 Database: ${MYSQL_DATABASE} at ${MYSQL_HOST}`);

      // Fetch exchange rates on startup
      await fetchExchangeRates();

      // Run database migrations
      await runDatabaseMigrations();
    } catch (error) {
      dbAvailable = false;
      console.error('❌ MySQL connection failed:', error);
      console.error('Please check your MySQL credentials in the Secrets tab');
    }
  } else {
    console.warn('⚠️  No MySQL configuration found. Please add MySQL credentials.');
    console.warn('⚠️  DB routes will return 503 (service unavailable).');
    dbAvailable = false;
  }
}

// Database migrations
async function runDatabaseMigrations() {
  if (!pool) return;

  try {
    // Check if notify_7_days column exists in notification_settings
    const columns = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'notification_settings' 
      AND COLUMN_NAME = 'notify_7_days'
    `, [process.env.MYSQL_DATABASE]);

    if ((columns as any[]).length === 0) {
      console.log('🔧 Adding notify_7_days column to notification_settings...');
      await query(`
        ALTER TABLE notification_settings 
        ADD COLUMN notify_7_days TINYINT(1) DEFAULT 1 AFTER notify_15_days
      `);
      console.log('✅ Added notify_7_days column successfully');
      
      // Backfill legacy rows
      await query(`
        UPDATE notification_settings 
        SET notify_7_days = 1 
        WHERE notify_7_days IS NULL
      `);
      console.log('✅ Backfilled notify_7_days for legacy rows');
    } else {
      console.log('✅ Database schema is up to date');
    }
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  }
}

// Helper function to execute MySQL queries
async function query(sql: string, params: any[] = []) {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.query(sql, params);
  return rows;
}

function ensureDb(res: express.Response) {
  if (!dbAvailable || !pool) {
    res.status(503).json({
      success: false,
      message: 'Database not available. Please configure MySQL credentials and restart.',
    });
    return false;
  }
  return true;
}

// Health check endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Query user from database - using email as username
    const users = await query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [username]
    ) as any[];

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // If stored password looks like a bcrypt hash (starts with $2), compare with bcrypt
    const stored = user.password || '';
    let passwordMatch = false;
    try {
      if (typeof stored === 'string' && stored.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, stored);
      } else {
        // Fallback: plain text comparison (not recommended). Log a warning.
        console.warn('⚠️  User has non-hashed password in DB (insecure). Consider hashing passwords with bcrypt.');
        passwordMatch = password === stored;
      }
    } catch (err) {
      console.error('Password compare error:', err);
      passwordMatch = false;
    }

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // TODO: issue JWT here in production
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.email,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile (stubbed — replace with JWT validation in production)
app.get('/api/auth/me', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/auth/user', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// --- LICENSES ---
app.get('/api/licenses', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    // Fetch latest exchange rates
    await fetchExchangeRates();

    const licenses = await query(`
      SELECT 
        lp.id,
        lp.client_id,
        lp.user_id,
        lp.tool_name,
        lp.make,
        lp.model,
        lp.version,
        lp.vendor,
        lp.purchase_date,
        lp.expiration_date,
        lp.quantity,
        lp.cost_per_user,
        lp.total_cost,
        lp.total_cost_inr,
        lp.invoice_no,
        lp.serial_no,
        lp.currency_code,
        lp.original_amount,
        lp.created_at,
        lp.updated_at,
        c.name as client_name
      FROM license_purchases lp
      LEFT JOIN clients c ON lp.client_id = c.id
      ORDER BY lp.created_at DESC
    `) as any[];

    // Recalculate total_cost_inr with current exchange rates
    const licensesWithLiveRates = licenses.map((l: any) => {
      const originalTotal = parseFloat(l.total_cost) || 0;
      const totalCostInr = calculateINR(originalTotal, l.currency_code || 'INR');
      
      return {
        ...l,
        total_cost_inr: totalCostInr
      };
    });

    res.json({
      success: true,
      data: licensesWithLiveRates
    });
  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/licenses', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const {
      client_id,
      vendor,
      invoice_number,
      tool_name,
      make,
      model,
      version,
      cost_per_user,
      quantity,
      total_cost,
      total_cost_inr,
      purchase_date,
      expiration_date,
      currency_code,
      original_amount,
      serial_no,
      status,
      notes
    } = req.body;

    // Find a user to attach as created_by (temporary)
    const users = await query('SELECT id FROM users LIMIT 1') as any[];
    const user_id = users[0]?.id ?? null;

    const insertResult = await query(
      `INSERT INTO license_purchases (
        client_id, 
        user_id, 
        tool_name,
        make,
        model,
        version,
        vendor,
        purchase_date, 
        expiration_date, 
        quantity, 
        cost_per_user, 
        total_cost,
        total_cost_inr,
        invoice_no,
        serial_no,
        currency_code,
        original_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id || null,
        user_id,
        tool_name || null,
        make || null,
        model || null,
        version || null,
        vendor || null,
        purchase_date || null,
        expiration_date || null,
        quantity || 1,
        cost_per_user || null,
        total_cost || null,
        total_cost_inr || null,
        invoice_number || null,
        serial_no || null,
        currency_code || 'INR',
        original_amount || null
      ]
    ) as any;

    const result = await query('SELECT * FROM license_purchases WHERE id = ?', [(insertResult as any).insertId]) as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Create license error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create license purchase',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/licenses/:id', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { id } = req.params;
    const {
      client_id,
      tool_name,
      make,
      model,
      version,
      vendor,
      quantity,
      cost_per_user,
      total_cost,
      total_cost_inr,
      purchase_date,
      expiration_date,
      invoice_no,
      serial_no,
      currency_code,
      original_amount,
      status,
      notes
    } = req.body;

    await query(
      `UPDATE license_purchases 
      SET 
        client_id = ?,
        tool_name = ?,
        make = ?,
        model = ?,
        version = ?,
        vendor = ?,
        quantity = ?,
        cost_per_user = ?,
        total_cost = ?,
        total_cost_inr = ?,
        purchase_date = ?,
        expiration_date = ?,
        invoice_no = ?,
        serial_no = ?,
        currency_code = ?,
        original_amount = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        client_id || null,
        tool_name || null,
        make || null,
        model || null,
        version || null,
        vendor || null,
        quantity || null,
        cost_per_user || null,
        total_cost || null,
        total_cost_inr || null,
        purchase_date || null,
        expiration_date || null,
        invoice_no || null,
        serial_no || null,
        currency_code || null,
        original_amount || null,
        id
      ]
    );

    const result = await query('SELECT * FROM license_purchases WHERE id = ?', [id]) as any[];

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'License not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update license',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// --- Currencies ---
app.get('/api/currencies', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const currencies = await query(
      'SELECT * FROM currencies ORDER BY is_default DESC, code ASC'
    ) as any[];

    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// --- Clients ---
app.get('/api/clients', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const clients = await query(
      'SELECT * FROM clients ORDER BY created_at DESC'
    ) as any[];

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { 
      name, 
      contact_person, 
      phone, 
      email, 
      address, 
      company_name, 
      gst_treatment, 
      source_of_supply, 
      pan, 
      currency_id, 
      mode_of_payment, 
      amount, 
      quantity 
    } = req.body;
    
    const users = await query('SELECT id FROM users LIMIT 1') as any[];
    const user_id = users[0]?.id ?? null;

    const insertResult = await query(
      `INSERT INTO clients (
        user_id, 
        name, 
        contact_person, 
        phone, 
        email, 
        address, 
        company_name, 
        gst_treatment, 
        source_of_supply, 
        pan, 
        currency_id, 
        mode_of_payment, 
        amount, 
        quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, 
        name, 
        contact_person ?? null, 
        phone ?? null, 
        email ?? null, 
        address ?? null, 
        company_name ?? null, 
        gst_treatment ?? null, 
        source_of_supply ?? null, 
        pan ?? null, 
        currency_id ?? null, 
        mode_of_payment ?? null, 
        amount ?? null, 
        quantity ?? null
      ]
    ) as any;

    const result = await query('SELECT * FROM clients WHERE id = ?', [(insertResult as any).insertId]) as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { id } = req.params;
    const { 
      name, 
      contact_person, 
      phone, 
      email, 
      address, 
      company_name, 
      gst_treatment, 
      source_of_supply, 
      pan, 
      currency_id, 
      mode_of_payment, 
      amount, 
      quantity 
    } = req.body;

    await query(
      `UPDATE clients 
      SET name = ?, 
          contact_person = ?,
          phone = ?, 
          email = ?,
          address = ?,
          company_name = ?,
          gst_treatment = ?,
          source_of_supply = ?,
          pan = ?,
          currency_id = ?,
          mode_of_payment = ?,
          amount = ?,
          quantity = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name, 
        contact_person ?? null, 
        phone ?? null, 
        email ?? null, 
        address ?? null, 
        company_name ?? null, 
        gst_treatment ?? null, 
        source_of_supply ?? null, 
        pan ?? null, 
        currency_id ?? null, 
        mode_of_payment ?? null, 
        amount ?? null, 
        quantity ?? null, 
        id
      ]
    );

    const result = await query('SELECT * FROM clients WHERE id = ?', [id]) as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { id } = req.params;

    const clients = await query(
      'SELECT * FROM clients WHERE id = ? LIMIT 1',
      [id]
    ) as any[];

    if (!clients || clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const licensesRaw = await query(
      `SELECT 
        lp.*,
        c.symbol as currency_symbol
      FROM license_purchases lp
      LEFT JOIN currencies c ON lp.currency_code = c.code
      WHERE lp.client_id = ?
      ORDER BY lp.created_at DESC`,
      [id]
    ) as any[];

    const client = clients[0];

    // Fetch latest exchange rates
    await fetchExchangeRates();

    // Calculate active/expired based on expiration_date
    const now = new Date();
    
    // Transform licenses to match frontend expectations with LIVE conversion
    const licenses = licensesRaw.map((l: any) => {
      const expirationDate = l.expiration_date ? new Date(l.expiration_date) : null;
      const isExpired = expirationDate ? expirationDate <= now : false;
      
      // Calculate total_cost_inr using CURRENT exchange rates
      const originalTotal = parseFloat(l.total_cost) || 0;
      const totalCostInr = calculateINR(originalTotal, l.currency_code || 'INR');
      
      return {
        id: l.id,
        tool_name: l.tool_name || 'N/A',
        tool_description: l.model || l.version || null,
        tool_vendor: l.vendor || 'N/A',
        purchase_date: l.purchase_date,
        expiry_date: l.expiration_date,
        number_of_users: l.quantity || 1,
        cost_per_user: l.cost_per_user || 0,
        total_cost: originalTotal,
        total_cost_inr: totalCostInr,
        currency_code: l.currency_code || 'INR',
        currency_symbol: l.currency_symbol || '₹',
        status: isExpired ? 'expired' : 'active'
      };
    });
    
    const activeLicenses = licenses.filter((l: any) => l.status === 'active').length;
    const expiredLicenses = licenses.filter((l: any) => l.status === 'expired').length;

    res.json({
      success: true,
      data: {
        client,
        licenses,
        stats: {
          total_licenses: licenses.length,
          active_licenses: activeLicenses,
          expired_licenses: expiredLicenses,
          total_cost: licenses.reduce((sum: number, l: any) => sum + parseFloat(l.total_cost_inr || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/clients', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { id } = req.body;

    await query(
      'DELETE FROM clients WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// --- Vendors ---
app.get('/api/vendors', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const vendors = await query(
      `SELECT 
        v.*,
        c.code as currency_code,
        c.name as currency_name,
        c.symbol as currency_symbol,
        c.exchange_rate_to_inr
      FROM vendors v
      LEFT JOIN currencies c ON v.currency_id = c.id
      ORDER BY v.created_at DESC`
    ) as any[];

    const vendorsWithConversion = vendors.map((vendor: any) => {
      const exchangeRate = parseFloat(vendor.exchange_rate_to_inr || '1');
      const amount = parseFloat(vendor.amount || '0');
      const amountInINR = amount * exchangeRate;

      return {
        ...vendor,
        amount_inr: amountInINR,
        amount_formatted: vendor.currency_symbol ? `${vendor.currency_symbol}${amount.toFixed(2)}` : `₹${amount.toFixed(2)}`,
        amount_inr_formatted: `₹${amountInINR.toFixed(2)}`
      };
    });

    res.json({
      success: true,
      data: vendorsWithConversion
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { 
      name, 
      contact_person, 
      email, 
      phone, 
      address, 
      company_name,
      gst_treatment,
      source_of_supply,
      pan,
      currency_id,
      mode_of_payment,
      amount,
      quantity
    } = req.body;

    if (pan && (pan.length !== 10 || pan !== pan.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'PAN must be exactly 10 uppercase characters',
        error: 'Invalid PAN format'
      });
    }

    const insertResult = await query(
      `INSERT INTO vendors (
        name, 
        contact_person, 
        email, 
        phone, 
        address, 
        company_name,
        gst_treatment,
        source_of_supply,
        pan,
        currency_id,
        mode_of_payment,
        amount,
        quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        contact_person || null,
        email || null,
        phone || null,
        address || null,
        company_name || null,
        gst_treatment || null,
        source_of_supply || null,
        pan || null,
        currency_id || null,
        mode_of_payment || null,
        amount || null,
        quantity || null
      ]
    ) as any;

    const result = await query('SELECT * FROM vendors WHERE id = ?', [(insertResult as any).insertId]) as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vendor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/vendors/:id', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { id } = req.params;
    const { 
      name, 
      contact_person, 
      email, 
      phone, 
      address, 
      company_name,
      gst_treatment,
      source_of_supply,
      pan,
      currency_id,
      mode_of_payment,
      amount,
      quantity
    } = req.body;

    if (pan && (pan.length !== 10 || pan !== pan.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'PAN must be exactly 10 uppercase characters',
        error: 'Invalid PAN format'
      });
    }

    await query(
      `UPDATE vendors 
      SET name = ?, 
          contact_person = ?, 
          email = ?, 
          phone = ?, 
          address = ?, 
          company_name = ?,
          gst_treatment = ?,
          source_of_supply = ?,
          pan = ?,
          currency_id = ?,
          mode_of_payment = ?,
          amount = ?,
          quantity = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name,
        contact_person || null,
        email || null,
        phone || null,
        address || null,
        company_name || null,
        gst_treatment || null,
        source_of_supply || null,
        pan || null,
        currency_id || null,
        mode_of_payment || null,
        amount || null,
        quantity || null,
        id
      ]
    );

    const result = await query('SELECT * FROM vendors WHERE id = ?', [id]) as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/vendors', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { id } = req.body;

    await query(
      'DELETE FROM vendors WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// --- User Roles & Dashboard & Notifications (kept as before, with DB checks) ---

app.get('/api/user-roles/:userId', async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const { userId } = req.params;

    const roles = await query(
      'SELECT * FROM user_roles WHERE user_id = ?',
      [userId]
    ) as any[];

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/user-roles', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { user_id, role_type, can_create, can_read, can_update, can_delete } = req.body;

    const canCreateVal = can_create || false;
    const canReadVal = can_read ?? true;
    const canUpdateVal = can_update || false;
    const canDeleteVal = can_delete || false;

    await query(
      `INSERT INTO user_roles (user_id, role_type, can_create, can_read, can_update, can_delete) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        can_create = VALUES(can_create),
        can_read = VALUES(can_read),
        can_update = VALUES(can_update),
        can_delete = VALUES(can_delete),
        updated_at = CURRENT_TIMESTAMP`,
      [user_id, role_type, canCreateVal, canReadVal, canUpdateVal, canDeleteVal]
    );

    const result = await query(
      'SELECT * FROM user_roles WHERE user_id = ? AND role_type = ?',
      [user_id, role_type]
    ) as any[];

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Create/update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update user role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/user-roles', async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const { id } = req.body;

    await query(
      'DELETE FROM user_roles WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User role deleted successfully'
    });
  } catch (error) {
    console.error('Delete user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const totalLicenses = await query('SELECT COUNT(*) as count FROM license_purchases') as any[];
    const totalClients = await query('SELECT COUNT(*) as count FROM clients') as any[];
    
    // Use expiration_date to determine active/expired status
    const activeLicenses = await query('SELECT COUNT(*) as count FROM license_purchases WHERE expiration_date > NOW()') as any[];
    const expiredLicenses = await query('SELECT COUNT(*) as count FROM license_purchases WHERE expiration_date <= NOW()') as any[];

    res.json({
      success: true,
      data: {
        totalLicenses: parseInt(totalLicenses[0].count),
        totalClients: parseInt(totalClients[0].count),
        activeLicenses: parseInt(activeLicenses[0].count),
        expiredLicenses: parseInt(expiredLicenses[0].count)
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Notification Settings & Email sending (kept mostly as-is)
app.get('/api/notification-settings', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const users = await query('SELECT id FROM users LIMIT 1') as any[];
    const user_id = users[0]?.id;

    if (!user_id) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const settings = await query(
      'SELECT * FROM notification_settings WHERE user_id = ? LIMIT 1',
      [user_id]
    ) as any[];

    if (settings.length === 0) {
      const insertResult = await query(
        `INSERT INTO notification_settings (
          user_id, 
          notify_45_days,
          notify_30_days, 
          notify_15_days, 
          notify_5_days, 
          notify_1_day, 
          notify_on_expiry,
          notify_post_expiry,
          email_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, true, true, true, true, true, true, true, true]
      ) as any;

      const defaultSettings = await query(
        'SELECT * FROM notification_settings WHERE id = ?',
        [insertResult.insertId]
      ) as any[];

      const defaultTime = defaultSettings[0].notification_time 
        ? (typeof defaultSettings[0].notification_time === 'string' ? defaultSettings[0].notification_time.substring(0, 5) : '15:30')
        : '15:30';
      return res.json({
        success: true,
        data: {
          email_notifications_enabled: defaultSettings[0].email_enabled,
          notification_days: [
            defaultSettings[0].notify_45_days ? 45 : null,
            defaultSettings[0].notify_30_days ? 30 : null,
            defaultSettings[0].notify_15_days ? 15 : null,
            defaultSettings[0].notify_5_days ? 5 : null,
            defaultSettings[0].notify_1_day ? 1 : null,
            defaultSettings[0].notify_on_expiry ? 0 : null
          ].filter((d: any) => d !== null),
          notification_time: defaultTime,
          timezone: defaultSettings[0].timezone || 'UTC'
        }
      });
    }

    const setting = settings[0];
    const timeStr = setting.notification_time 
      ? (typeof setting.notification_time === 'string' ? setting.notification_time.substring(0, 5) : '15:30')
      : '15:30';
    res.json({
      success: true,
      data: {
        email_notifications_enabled: setting.email_enabled,
        notification_days: [
          setting.notify_45_days ? 45 : null,
          setting.notify_30_days ? 30 : null,
          setting.notify_15_days ? 15 : null,
          setting.notify_7_days ? 7 : null,
          setting.notify_5_days ? 5 : null,
          setting.notify_1_day ? 1 : null,
          setting.notify_on_expiry ? 0 : null
        ].filter((d: any) => d !== null),
        notification_time: timeStr,
        timezone: setting.timezone || 'UTC'
      }
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/notification-settings', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const { email_notifications_enabled, notification_days, notification_time, timezone } = req.body;

    const users = await query('SELECT id FROM users LIMIT 1') as any[];
    const user_id = users[0]?.id;

    if (!user_id) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notify_45_days = notification_days?.includes(45) ?? false;
    const notify_30_days = notification_days?.includes(30) ?? true;
    const notify_15_days = notification_days?.includes(15) ?? true;
    const notify_7_days = notification_days?.includes(7) ?? true;
    const notify_5_days = notification_days?.includes(5) ?? false;
    const notify_1_day = notification_days?.includes(1) ?? true;
    const notify_on_expiry = notification_days?.includes(0) ?? true;

    const existingSettings = await query(
      'SELECT id FROM notification_settings WHERE user_id = ? LIMIT 1',
      [user_id]
    ) as any[];

    if (existingSettings.length === 0) {
      await query(
        `INSERT INTO notification_settings (
          user_id, 
          notify_45_days,
          notify_30_days, 
          notify_15_days,
          notify_7_days, 
          notify_5_days, 
          notify_1_day, 
          notify_on_expiry,
          notify_post_expiry,
          email_enabled,
          notification_time,
          timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          notify_45_days,
          notify_30_days,
          notify_15_days,
          notify_7_days,
          notify_5_days,
          notify_1_day,
          notify_on_expiry,
          true,
          email_notifications_enabled ?? true,
          notification_time || '09:00',
          timezone || 'UTC'
        ]
      );
    } else {
      await query(
        `UPDATE notification_settings 
        SET 
          notify_45_days = ?,
          notify_30_days = ?,
          notify_15_days = ?,
          notify_7_days = ?,
          notify_5_days = ?,
          notify_1_day = ?,
          notify_on_expiry = ?,
          email_enabled = ?,
          notification_time = ?,
          timezone = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [
          notify_45_days,
          notify_30_days,
          notify_15_days,
          notify_7_days,
          notify_5_days,
          notify_1_day,
          notify_on_expiry,
          email_notifications_enabled ?? true,
          notification_time || '09:00',
          timezone || 'UTC',
          user_id
        ]
      );
    }

    // Restart email scheduler with new time if time was changed
    if (notification_time && globalEmailScheduler) {
      console.log(`🔄 Restarting email scheduler with new time: ${notification_time}`);
      globalEmailScheduler.stop();
      globalEmailScheduler = new EmailScheduler(notification_time, `http://localhost:${PORT}`);
      globalEmailScheduler.start(false); // Don't run immediate check, just reschedule
      console.log(`✅ Email scheduler restarted with time: ${notification_time}`);
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully. Email scheduler restarted with new time.'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Email notification helpers
async function sendExpiryEmail(recipientEmail: string, licenseInfo: any, daysUntilExpiry: number): Promise<boolean> {
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    console.error('No authentication token found for email sending');
    return false;
  }

  const urgencyLevel = daysUntilExpiry === 0 ? 'critical' : daysUntilExpiry <= 5 ? 'high' : daysUntilExpiry <= 15 ? 'medium' : 'low';
  const urgencyColor = urgencyLevel === 'critical' ? '#dc2626' : urgencyLevel === 'high' ? '#ea580c' : urgencyLevel === 'medium' ? '#f59e0b' : '#3b82f6';
  
  const subject = daysUntilExpiry === 0
    ? `🔴 URGENT: License Expiring Today - ${licenseInfo.tool_name}`
    : daysUntilExpiry < 0
      ? `⚠️ License Expired ${Math.abs(daysUntilExpiry)} days ago - ${licenseInfo.tool_name}`
      : `⏰ License Expiring in ${daysUntilExpiry} days - ${licenseInfo.tool_name}`;

  const expiryMessage = daysUntilExpiry === 0
    ? 'is expiring <strong>TODAY</strong>'
    : daysUntilExpiry < 0
      ? `expired <strong>${Math.abs(daysUntilExpiry)} days ago</strong>`
      : `will expire in <strong>${daysUntilExpiry} days</strong>`;

  const expiryDate = licenseInfo.expiration_date ? new Date(licenseInfo.expiration_date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">License Expiry Alert</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Dear User,
        </p>
        
        <div style="background-color: ${urgencyColor}10; border-left: 4px solid ${urgencyColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #1f2937; font-size: 16px; margin: 0;">
            Your license for <strong>${licenseInfo.tool_name}</strong> ${expiryMessage}.
          </p>
        </div>
        
        <h2 style="color: #1f2937; font-size: 18px; margin-top: 30px; margin-bottom: 16px; font-weight: 600;">License Details</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; width: 40%;">License ID:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; font-weight: 500;">${licenseInfo.id || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Tool Name:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; font-weight: 500;">${licenseInfo.tool_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Client:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; font-weight: 500;">${licenseInfo.client_name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Number of Users:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; font-weight: 500;">${licenseInfo.quantity || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Expiry Date:</td>
            <td style="padding: 12px 0; color: ${urgencyColor}; font-size: 14px; font-weight: 600;">${expiryDate}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
            Please take necessary action to renew this license to avoid service interruption.
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This is an automated notification from your License Management System
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
License Expiry Notification

Dear User,

Your license for ${licenseInfo.tool_name} ${expiryMessage.replace(/<[^>]*>/g, '')}.

License Details:
- License ID: ${licenseInfo.id || 'N/A'}
- Tool: ${licenseInfo.tool_name}
- Client: ${licenseInfo.client_name || 'N/A'}
- Number of Users: ${licenseInfo.quantity || 'N/A'}
- Expiry Date: ${expiryDate}

Please take necessary action to renew this license to avoid service interruption.

Best regards,
License Management System
  `;

  try {
    const response = await fetch(
      "https://connectors.replit.com/api/v2/mailer/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X_REPLIT_TOKEN": xReplitToken,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject,
          text: text,
          html: html
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return false;
    } else {
      console.log(`✅ Email sent to ${recipientEmail} for license ${licenseInfo.id}`);
      return true;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

app.post('/api/notifications/check-expiring-licenses', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await query('SELECT id FROM users LIMIT 1') as any[];
    const user_id = users[0]?.id;

    if (!user_id) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const settings = await query(
      'SELECT * FROM notification_settings WHERE user_id = ? LIMIT 1',
      [user_id]
    ) as any[];

    if (settings.length === 0 || !settings[0].email_enabled) {
      return res.json({
        success: true,
        message: 'Email notifications are disabled',
        emailsSent: 0
      });
    }

    const notificationSettings = settings[0];
    const daysToCheck = [];

    if (notificationSettings.notify_45_days) daysToCheck.push(45);
    if (notificationSettings.notify_30_days) daysToCheck.push(30);
    if (notificationSettings.notify_15_days) daysToCheck.push(15);
    if (notificationSettings.notify_7_days) daysToCheck.push(7);
    if (notificationSettings.notify_5_days) daysToCheck.push(5);
    if (notificationSettings.notify_1_day) daysToCheck.push(1);
    if (notificationSettings.notify_on_expiry) daysToCheck.push(0);

    const licenses = await query(
      `SELECT 
        lp.id,
        lp.tool_name,
        lp.vendor,
        lp.expiration_date,
        lp.quantity,
        lp.client_id,
        c.name as client_name,
        c.email as client_email,
        v.email as vendor_email,
        v.name as vendor_name
      FROM license_purchases lp
      LEFT JOIN clients c ON lp.client_id = c.id
      LEFT JOIN vendors v ON lp.vendor = v.name
      WHERE lp.expiration_date >= CURDATE()
      ORDER BY lp.expiration_date ASC`
    ) as any[];

    let emailsSent = 0;
    let emailsFailed = 0;

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    if (!adminEmail || adminEmail === 'admin@example.com') {
      console.warn('⚠️  Admin email not configured. Set ADMIN_EMAIL environment variable.');
    }

    for (const license of licenses) {
      const expiryDate = new Date(license.expiration_date);
      expiryDate.setHours(0, 0, 0, 0);

      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysToCheck.includes(daysUntilExpiry)) {
        const notificationType = daysUntilExpiry === 0 ? '0_days' : 
                                 daysUntilExpiry === 1 ? '1_day' :
                                 daysUntilExpiry === 5 ? '5_days' :
                                 daysUntilExpiry === 7 ? '7_days' :
                                 daysUntilExpiry === 15 ? '15_days' :
                                 daysUntilExpiry === 30 ? '30_days' :
                                 daysUntilExpiry === 45 ? '45_days' : null;

        if (!notificationType) continue;

        const alreadySentCheck = await query(
          `SELECT id FROM email_notifications 
           WHERE license_id = ? AND notification_type = ? AND DATE(email_sent_at) = CURDATE()
           LIMIT 1`,
          [license.id, notificationType]
        ) as any[];

        if (alreadySentCheck.length > 0) {
          console.log(`⏭️  Already sent ${notificationType} notification for license ${license.id} today`);
          continue;
        }

        const subject = daysUntilExpiry === 0
          ? `🔴 URGENT: License Expiring Today - ${license.tool_name}`
          : `⏰ License Expiring in ${daysUntilExpiry} days - ${license.tool_name}`;

        const adminSent = await sendExpiryEmail(adminEmail, license, daysUntilExpiry);
        if (adminSent) {
          emailsSent++;
          await query(
            `INSERT INTO email_notifications (user_id, license_id, notification_type, email_status, email_subject, email_body)
             VALUES (?, ?, ?, 'sent', ?, 'Admin notification email')`,
            [user_id, license.id, notificationType, subject]
          );
        } else {
          emailsFailed++;
          await query(
            `INSERT INTO email_notifications (user_id, license_id, notification_type, email_status, email_subject, email_body)
             VALUES (?, ?, ?, 'failed', ?, 'Admin notification email')`,
            [user_id, license.id, notificationType, subject]
          );
        }

        if (license.client_email) {
          const clientSent = await sendExpiryEmail(license.client_email, license, daysUntilExpiry);
          if (clientSent) {
            emailsSent++;
            await query(
              `INSERT INTO email_notifications (user_id, license_id, notification_type, email_status, email_subject, email_body)
               VALUES (?, ?, ?, 'sent', ?, 'Client notification email')`,
              [user_id, license.id, notificationType, subject]
            );
          } else {
            emailsFailed++;
            await query(
              `INSERT INTO email_notifications (user_id, license_id, notification_type, email_status, email_subject, email_body)
               VALUES (?, ?, ?, 'failed', ?, 'Client notification email')`,
              [user_id, license.id, notificationType, subject]
            );
          }
        }

        if (license.vendor_email) {
          const vendorSent = await sendExpiryEmail(license.vendor_email, license, daysUntilExpiry);
          if (vendorSent) {
            emailsSent++;
            await query(
              `INSERT INTO email_notifications (user_id, license_id, notification_type, email_status, email_subject, email_body)
               VALUES (?, ?, ?, 'sent', ?, 'Vendor notification email')`,
              [user_id, license.id, notificationType, subject]
            );
          } else {
            emailsFailed++;
            await query(
              `INSERT INTO email_notifications (user_id, license_id, notification_type, email_status, email_subject, email_body)
               VALUES (?, ?, ?, 'failed', ?, 'Vendor notification email')`,
              [user_id, license.id, notificationType, subject]
            );
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Checked ${licenses.length} licenses, sent ${emailsSent} emails${emailsFailed > 0 ? `, ${emailsFailed} failed` : ''}`,
      emailsSent: emailsSent,
      emailsFailed: emailsFailed
    });
  } catch (error) {
    console.error('Error checking expiring licenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check expiring licenses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get email notification history
app.get('/api/notifications/history', async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await query(
      `SELECT 
        en.id,
        en.license_id,
        en.notification_type,
        en.email_status,
        en.email_subject,
        en.email_sent_at,
        lp.tool_name,
        lp.vendor,
        lp.expiration_date,
        c.name as client_name,
        c.email as client_email
      FROM email_notifications en
      LEFT JOIN license_purchases lp ON en.license_id = lp.id
      LEFT JOIN clients c ON lp.client_id = c.id
      ORDER BY en.email_sent_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    const total = await query(
      'SELECT COUNT(*) as count FROM email_notifications'
    ) as any[];

    res.json({
      success: true,
      data: {
        history: history,
        total: total[0]?.count || 0,
        limit: limit,
        offset: offset
      }
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/notifications/send-test-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const ok = await sendExpiryEmail(email, {
      id: 'TEST-001',
      tool_name: 'Test Tool',
      client_name: 'Test Client',
      quantity: 5,
      expiration_date: new Date().toISOString()
    }, 0);

    if (!ok) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email'
      });
    }

    res.json({
      success: true,
      message: `Test email sent to ${email}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// start server
async function startServer() {
  try {
    await initDatabase();

    // Listen on '::' so both IPv6 (::1) and IPv4 (127.0.0.1) proxies can connect.
    app.listen(PORT, '::', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📊 API endpoints available at http://0.0.0.0:${PORT}/api`);
      if (!dbAvailable) {
        console.warn('⚠️  DB is not available — database routes will return 503 until DATABASE_URL is configured.');
      } else {
        // Get notification time from database settings
        const getNotificationTime = async () => {
          try {
            const settings = await query('SELECT notification_time FROM notification_settings LIMIT 1') as any[];
            if (settings.length > 0 && settings[0].notification_time) {
              const time = settings[0].notification_time;
              // Convert TIME format to HH:MM string
              const timeStr = typeof time === 'string' ? time.substring(0, 5) : '09:00';
              return timeStr;
            }
            return '09:00'; // Default fallback
          } catch (err) {
            console.warn('⚠️  Could not read notification time from settings, using default 09:00');
            return '09:00';
          }
        };

        getNotificationTime().then((notificationTime) => {
          globalEmailScheduler = new EmailScheduler(notificationTime, `http://localhost:${PORT}`);
          globalEmailScheduler.start(true); // Run immediate check on startup + daily at configured time
          console.log(`📧 Email notification scheduler initialized with time: ${notificationTime}`);
        });
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
