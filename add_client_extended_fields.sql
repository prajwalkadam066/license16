-- Add Extended Client Fields Migration
-- This adds all the missing fields to match cPanel schema

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255) AFTER name,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) AFTER email,
ADD COLUMN IF NOT EXISTS address TEXT AFTER company_name,
ADD COLUMN IF NOT EXISTS gst_treatment VARCHAR(100) AFTER address,
ADD COLUMN IF NOT EXISTS source_of_supply VARCHAR(100) AFTER gst_treatment,
ADD COLUMN IF NOT EXISTS pan CHAR(10) AFTER source_of_supply,
ADD COLUMN IF NOT EXISTS currency_id CHAR(36) AFTER pan,
ADD COLUMN IF NOT EXISTS mode_of_payment VARCHAR(100) AFTER currency_id,
ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2) AFTER mode_of_payment,
ADD COLUMN IF NOT EXISTS quantity INT AFTER amount,
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active' AFTER quantity;

-- Add foreign key constraint for currency_id if currencies table exists
-- ALTER TABLE clients
-- ADD CONSTRAINT fk_clients_currency 
-- FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;
