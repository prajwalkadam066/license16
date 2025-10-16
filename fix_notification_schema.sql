-- Fix notification_settings table to match backend code expectations
USE cybaemtechnet_LMS_Project;

-- Drop and recreate with correct schema
DROP TABLE IF EXISTS notification_settings;

CREATE TABLE notification_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE,
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

-- Insert default settings for all users
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
FROM users;

SELECT 'Notification settings table fixed!' AS status;
SELECT COUNT(*) as settings_count FROM notification_settings;
