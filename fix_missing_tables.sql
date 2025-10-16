-- Fix Missing Tables for License Management System
-- Run this to add user_roles table and fix notification_settings

USE cybaemtechnet_LMS_Project;

-- =================================================
-- CREATE USER_ROLES TABLE (if not exists)
-- =================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    role_type VARCHAR(50) NOT NULL,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT TRUE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role_type (role_type),
    UNIQUE KEY unique_user_role (user_id, role_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- FIX NOTIFICATION_SETTINGS TABLE STRUCTURE
-- =================================================
-- Drop if exists and recreate with correct structure
DROP TABLE IF EXISTS notification_settings;

CREATE TABLE notification_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    notification_days VARCHAR(255) DEFAULT '45,30,15,5,1,0',
    notification_time VARCHAR(10) DEFAULT '09:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_settings_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================
-- INSERT DEFAULT NOTIFICATION SETTINGS FOR ALL USERS
-- =================================================
INSERT INTO notification_settings (user_id, email_notifications_enabled, notification_days, notification_time, timezone)
SELECT 
    id,
    TRUE,
    '45,30,15,5,1,0',
    '09:00',
    'UTC'
FROM users
WHERE id NOT IN (SELECT COALESCE(user_id, '') FROM notification_settings WHERE user_id IS NOT NULL);

-- =================================================
-- VERIFY SETUP
-- =================================================
SELECT 'Tables created successfully!' AS status;
SELECT COUNT(*) as user_roles_count FROM user_roles;
SELECT COUNT(*) as notification_settings_count FROM notification_settings;
