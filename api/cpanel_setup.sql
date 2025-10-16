-- MySQL/MariaDB Database Setup for cPanel Hosting
-- Use this if your cPanel hosting doesn't support PostgreSQL

-- Create database and user (usually done through cPanel interface)
-- CREATE DATABASE cpanel_user_license_db;
-- CREATE USER 'cpanel_user_dbuser'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON cpanel_user_license_db.* TO 'cpanel_user_dbuser'@'localhost';
-- FLUSH PRIVILEGES;

-- Use the database
USE cybaemtechnet_lms;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS license_usage_logs;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS email_notifications;
DROP TABLE IF EXISTS license_allocations;
DROP TABLE IF EXISTS license_purchases;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS users;

-- Users table with MySQL-compatible structure
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'accounts', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

-- Clients table
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
);

-- Currencies table
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
);

-- Tools table
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
);

-- License purchases table
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
);

-- License allocations table
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
);

-- Email notifications table
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
);

-- Notification settings table
CREATE TABLE notification_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    notification_days VARCHAR(50) DEFAULT '30,15,5,1,0', -- Comma-separated values for MySQL compatibility
    notification_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_settings_user_id (user_id)
);

-- License usage logs table
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
);

-- Insert the specified users with hashed passwords
-- Note: Default password is "password" - change this in production
INSERT INTO users (id, email, password, role) VALUES 
(UUID(), 'rohan.bhosale@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
(UUID(), 'accounts@cybaemtech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'accounts');

-- Insert default currencies
INSERT INTO currencies (id, code, name, symbol, is_default) VALUES 
(UUID(), 'INR', 'Indian Rupee', '₹', TRUE),
(UUID(), 'USD', 'US Dollar', '$', FALSE),
(UUID(), 'EUR', 'Euro', '€', FALSE);

-- Show created tables
SHOW TABLES;