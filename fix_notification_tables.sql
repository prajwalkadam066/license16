-- Fix notification_settings table structure
-- Drop the old table if it exists (if it's empty)
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS email_notifications;

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    license_id VARCHAR(36),
    notification_type ENUM('45_days', '30_days', '15_days', '5_days', '1_day', '0_days', 'expired') NOT NULL,
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

-- Create notification_settings table with correct column names
CREATE TABLE IF NOT EXISTS notification_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    notify_45_days BOOLEAN DEFAULT TRUE,
    notify_30_days BOOLEAN DEFAULT TRUE,
    notify_15_days BOOLEAN DEFAULT TRUE,
    notify_5_days BOOLEAN DEFAULT TRUE,
    notify_1_day BOOLEAN DEFAULT TRUE,
    notify_on_expiry BOOLEAN DEFAULT TRUE,
    notify_post_expiry BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_settings_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification settings for all users
INSERT INTO notification_settings (
    user_id, 
    email_enabled,
    notify_45_days,
    notify_30_days,
    notify_15_days,
    notify_5_days,
    notify_1_day,
    notify_on_expiry,
    notify_post_expiry
)
SELECT 
    id,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE
FROM users
WHERE id NOT IN (SELECT user_id FROM notification_settings WHERE user_id IS NOT NULL)
ON DUPLICATE KEY UPDATE
    email_enabled = TRUE,
    notify_45_days = TRUE,
    notify_30_days = TRUE,
    notify_15_days = TRUE,
    notify_5_days = TRUE,
    notify_1_day = TRUE,
    notify_on_expiry = TRUE;
