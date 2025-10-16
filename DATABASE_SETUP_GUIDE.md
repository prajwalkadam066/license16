# Complete MySQL Database Setup Guide

## 🚀 Quick Start Guide

### Step 1: Fix Localhost Error

**Problem**: `connect ECONNREFUSED ::1:8000`

**Solution**: You need to run BOTH frontend and backend servers together.

#### ✅ Correct Command (Run this):
```bash
npm run dev:full
```

This command starts:
- Backend server on port 8000
- Frontend server on port 5000

#### ❌ Wrong Command (Don't use this):
```bash
npm run dev  # Only starts frontend, backend won't work!
```

---

### Step 2: Configure MySQL Database

#### A. Create Your Database

**Option 1: Using phpMyAdmin or MySQL Workbench**
1. Open your MySQL management tool
2. Create a new database with name: `license_management_db` (or any name you prefer)
3. Note down your database credentials

**Option 2: Using MySQL Command Line**
```sql
CREATE DATABASE license_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### B. Set Environment Variables

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your MySQL credentials:

   **For Localhost:**
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=license_management_db
   PORT=8000
   ```

   **For Remote MySQL Server:**
   ```env
   MYSQL_HOST=82.25.105.94
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=license_management_db
   PORT=8000
   ```

   **For Replit (same as above, but add to Replit Secrets):**
   - Go to Replit Secrets (lock icon in sidebar)
   - Add each variable separately:
     - `MYSQL_HOST` = your host
     - `MYSQL_USER` = your username
     - `MYSQL_PASSWORD` = your password
     - `MYSQL_DATABASE` = your database name

---

### Step 3: Run SQL Setup Script

Use the **complete SQL script** provided below to set up all tables.

---

## 📋 Complete SQL Setup Script

Copy and run this **complete SQL script** in your MySQL database:

\`\`\`sql
-- =================================================
-- COMPLETE MYSQL DATABASE SETUP SCRIPT
-- License Management System
-- =================================================

-- Use your database (replace with your database name)
USE license_management_db;

-- Drop existing tables (if any) for clean setup
DROP TABLE IF EXISTS license_usage_logs;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS email_notifications;
DROP TABLE IF EXISTS license_allocations;
DROP TABLE IF EXISTS license_purchases;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS users;

-- =================================================
-- 1. USERS TABLE
-- =================================================
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'accounts', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 2. CLIENTS TABLE
-- =================================================
CREATE TABLE clients (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_clients_user_id (user_id),
    INDEX idx_clients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 3. CURRENCIES TABLE
-- =================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 4. VENDORS TABLE
-- =================================================
CREATE TABLE vendors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    company_name VARCHAR(255),
    gst_treatment VARCHAR(100),
    source_of_supply VARCHAR(100),
    pan CHAR(10),
    currency_id CHAR(36),
    mode_of_payment VARCHAR(100),
    amount DECIMAL(15,2),
    quantity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL,
    INDEX idx_vendors_name (name),
    INDEX idx_vendors_pan (pan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 5. TOOLS TABLE
-- =================================================
CREATE TABLE tools (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(255),
    cost_per_user DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tools_name (name),
    INDEX idx_tools_vendor (vendor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 6. LICENSE PURCHASES TABLE
-- =================================================
CREATE TABLE license_purchases (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    client_id CHAR(36),
    tool_name VARCHAR(255) NOT NULL,
    make VARCHAR(255),
    model VARCHAR(255),
    version VARCHAR(100),
    vendor VARCHAR(255),
    cost_per_user DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_cost DECIMAL(10,2) NOT NULL,
    total_cost_inr DECIMAL(10,2),
    purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NOT NULL,
    invoice_no VARCHAR(100),
    serial_no VARCHAR(255) UNIQUE,
    currency_code VARCHAR(10) DEFAULT 'INR',
    original_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    INDEX idx_license_purchases_user_id (user_id),
    INDEX idx_license_purchases_client_id (client_id),
    INDEX idx_license_purchases_tool_name (tool_name),
    INDEX idx_license_purchases_vendor (vendor),
    INDEX idx_license_purchases_expiration (expiration_date),
    INDEX idx_license_purchases_serial_no (serial_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 7. LICENSE ALLOCATIONS TABLE
-- =================================================
CREATE TABLE license_allocations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    purchase_id CHAR(36),
    assigned_to VARCHAR(255) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'revoked', 'expired') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES license_purchases(id) ON DELETE CASCADE,
    INDEX idx_license_allocations_purchase_id (purchase_id),
    INDEX idx_license_allocations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 8. EMAIL NOTIFICATIONS TABLE
-- =================================================
CREATE TABLE email_notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    license_id CHAR(36),
    notification_type ENUM('30_days', '15_days', '5_days', '1_day', '0_days', 'expired') NOT NULL,
    email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'sent',
    email_subject VARCHAR(500) NOT NULL,
    email_body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (license_id) REFERENCES license_purchases(id) ON DELETE CASCADE,
    INDEX idx_email_notifications_user_id (user_id),
    INDEX idx_email_notifications_license_id (license_id),
    INDEX idx_email_notifications_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 9. NOTIFICATION SETTINGS TABLE
-- =================================================
CREATE TABLE notification_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    notification_days VARCHAR(50) DEFAULT '30,15,5,1,0',
    notification_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_settings_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 10. LICENSE USAGE LOGS TABLE
-- =================================================
CREATE TABLE license_usage_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    license_id CHAR(36),
    user_id CHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (license_id) REFERENCES license_purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_license_usage_logs_license_id (license_id),
    INDEX idx_license_usage_logs_user_id (user_id),
    INDEX idx_license_usage_logs_accessed_at (accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- INSERT DEFAULT DATA
-- =================================================

-- Insert Default Users (password: "password" for both)
INSERT INTO users (id, email, password, role) VALUES 
(UUID(), 'rohan.bhosale@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
(UUID(), 'accounts@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'accounts');

-- Insert Default Currencies
INSERT INTO currencies (id, code, name, symbol, exchange_rate_to_inr, is_default) VALUES 
(UUID(), 'INR', 'Indian Rupee', '₹', 1.0000, TRUE),
(UUID(), 'USD', 'US Dollar', '$', 83.1200, FALSE),
(UUID(), 'EUR', 'Euro', '€', 90.3400, FALSE),
(UUID(), 'GBP', 'British Pound', '£', 105.6700, FALSE);

-- =================================================
-- VERIFY SETUP
-- =================================================

-- Show all created tables
SHOW TABLES;

-- Show user count
SELECT COUNT(*) as user_count FROM users;

-- Show currency count
SELECT COUNT(*) as currency_count FROM currencies;

-- Display default admin credentials
SELECT 'Default Login Credentials:' as info;
SELECT 'Email: rohan.bhosale@cybaemtech.com' as credential_1;
SELECT 'Password: password' as credential_2;
SELECT '⚠️ CHANGE PASSWORD AFTER FIRST LOGIN!' as warning;
\`\`\`

---

## 🔄 Complete Setup Steps

### For Localhost:

1. **Create MySQL Database**:
   ```sql
   CREATE DATABASE license_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Run the Complete SQL Script** (copy the script above)

3. **Create `.env` file**:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=license_management_db
   PORT=8000
   ```

4. **Start the application**:
   ```bash
   npm run dev:full
   ```

5. **Access the application**:
   - Open browser: `http://localhost:5002/lms`
   - Login with:
     - Email: `rohan.bhosale@cybaemtech.com`
     - Password: `password`

---

### For Replit:

1. **Add Secrets in Replit**:
   - Click the lock icon (🔒) in the left sidebar
   - Add these secrets:
     ```
     MYSQL_HOST=your_mysql_host
     MYSQL_USER=your_mysql_username
     MYSQL_PASSWORD=your_mysql_password
     MYSQL_DATABASE=your_database_name
     ```

2. **Run the Complete SQL Script** on your MySQL server

3. **Restart the Replit** - The app will automatically connect

4. **Access via Replit's webview**

---

## 🔐 Default Login Credentials

- **Admin Email**: `rohan.bhosale@cybaemtech.com`
- **Password**: `password`

- **Accounts Email**: `accounts@cybaemtech.com`
- **Password**: `password`

⚠️ **IMPORTANT**: Change these passwords after your first login!

---

## 🐛 Troubleshooting

### Problem: "Database not available" error

**Solution**:
1. Verify your `.env` file has correct MySQL credentials
2. Test MySQL connection manually
3. Ensure MySQL server is running
4. Check firewall allows connection to MySQL port (3306)

### Problem: "Connection refused" on localhost

**Solution**:
- Use `npm run dev:full` instead of `npm run dev`
- This runs BOTH frontend and backend

### Problem: Tables not created

**Solution**:
1. Ensure you selected the correct database: `USE license_management_db;`
2. Run the SQL script as MySQL admin/root user
3. Check for SQL errors in the output

---

## 📚 Additional Information

### Database Tables Created:
1. ✅ users
2. ✅ clients  
3. ✅ currencies
4. ✅ vendors
5. ✅ tools
6. ✅ license_purchases
7. ✅ license_allocations
8. ✅ email_notifications
9. ✅ notification_settings
10. ✅ license_usage_logs

### Port Configuration:
- **Backend API**: Port 8000
- **Frontend**: Port 5000
- **MySQL**: Port 3306 (default)
