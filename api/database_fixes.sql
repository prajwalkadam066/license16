-- Database fixes for email notifications table
-- Run this SQL to fix charset and collation issues

USE cybaemtech.net;

-- Fix the email_notifications table charset and collation
ALTER TABLE email_notifications 
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fix individual columns to ensure proper UTF-8 support
ALTER TABLE email_notifications 
MODIFY COLUMN email_subject VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN email_body TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure notification_type ENUM has correct values
ALTER TABLE email_notifications 
MODIFY COLUMN notification_type ENUM('30_days', '15_days', '5_days', '1_day', '0_days', 'expired') 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Fix email_status ENUM as well
ALTER TABLE email_notifications 
MODIFY COLUMN email_status ENUM('sent', 'failed', 'pending') 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent';

-- Verify the changes
SHOW CREATE TABLE email_notifications;

-- Also fix other tables that might have the same issue
ALTER TABLE license_purchases 
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE clients 
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Show final table structure
DESCRIBE email_notifications;