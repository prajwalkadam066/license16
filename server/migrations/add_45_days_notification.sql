-- Add 45_days to the notification_type enum in email_notifications table
-- This migration adds support for 45-day advance notifications

-- First check if the table exists, if not create it
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

-- If the table already exists with the old enum, we need to modify it
-- Note: This will only work if there are no existing '45_days' entries
-- ALTER TABLE email_notifications 
-- MODIFY COLUMN notification_type ENUM('45_days', '30_days', '15_days', '5_days', '1_day', '0_days', 'expired') NOT NULL;
