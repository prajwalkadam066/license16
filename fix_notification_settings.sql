-- Fix notification_settings table to match server expectations
-- Run this to ensure the table structure is correct

USE cybaemtechnet_LMS_Project;

-- Drop the table if it exists to recreate with correct schema
DROP TABLE IF EXISTS notification_settings;

-- Create notification_settings table with the schema expected by server/index.ts
CREATE TABLE notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) UNIQUE NOT NULL,
    notify_45_days BOOLEAN DEFAULT TRUE,
    notify_30_days BOOLEAN DEFAULT TRUE,
    notify_15_days BOOLEAN DEFAULT TRUE,
    notify_5_days BOOLEAN DEFAULT TRUE,
    notify_1_day BOOLEAN DEFAULT TRUE,
    notify_on_expiry BOOLEAN DEFAULT TRUE,
    notify_post_expiry BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    notification_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_settings_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table was created
SHOW CREATE TABLE notification_settings;
