-- =================================================
-- COMPLETE MYSQL DATABASE SETUP SCRIPT
-- License Management System - LicenseHub Enterprise
-- =================================================

-- Create database and user (usually done through cPanel interface or manually)
-- CREATE DATABASE cybaemtechnet_LMS_Project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER 'cybaemtechnet_LMS_Project'@'%' IDENTIFIED BY 'PrajwalAK12';
-- GRANT ALL PRIVILEGES ON cybaemtechnet_LMS_Project.* TO 'cybaemtechnet_LMS_Project'@'%';
-- FLUSH PRIVILEGES;

-- Use the database (replace with your database name if different)
USE cybaemtechnet_LMS_Project;

-- =================================================
-- DROP TABLES (for clean setup)
-- =================================================
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
-- 2. CURRENCIES TABLE
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
-- 3. CLIENTS TABLE
-- =================================================
CREATE TABLE clients (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL,
    INDEX idx_clients_user_id (user_id),
    INDEX idx_clients_name (name),
    INDEX idx_clients_pan (pan)
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
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    gst_treatment VARCHAR(100),
    source_of_supply VARCHAR(100),
    pan CHAR(10),
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
    notification_type ENUM('45_days', '30_days', '15_days', '7_days', '5_days', '1_day', '0_days', 'expired') NOT NULL,
    email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'sent',
    email_subject VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    email_body TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    recipient_email VARCHAR(255),
    tool_name VARCHAR(255),
    vendor VARCHAR(255),
    expiration_date TIMESTAMP NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (license_id) REFERENCES license_purchases(id) ON DELETE CASCADE,
    INDEX idx_email_notifications_user_id (user_id),
    INDEX idx_email_notifications_license_id (license_id),
    INDEX idx_email_notifications_type (notification_type),
    INDEX idx_email_notifications_status (email_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- 9. NOTIFICATION SETTINGS TABLE
-- =================================================
CREATE TABLE notification_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    notification_45_days BOOLEAN DEFAULT TRUE,
    notification_30_days BOOLEAN DEFAULT TRUE,
    notification_15_days BOOLEAN DEFAULT TRUE,
    notification_7_days BOOLEAN DEFAULT TRUE,
    notification_5_days BOOLEAN DEFAULT TRUE,
    notification_1_day BOOLEAN DEFAULT TRUE,
    notification_0_days BOOLEAN DEFAULT TRUE,
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

-- Insert Default Users (password: "password" for both users)
-- Password hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
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

-- =================================================
-- DEFAULT LOGIN CREDENTIALS
-- =================================================
-- Email: rohan.bhosale@cybaemtech.com
-- Password: password
-- 
-- Email: accounts@cybaemtech.com  
-- Password: password
--
-- ⚠️ IMPORTANT: Change these passwords after your first login!
-- =================================================
