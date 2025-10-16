-- Migration to add client detail fields to license_purchases table
-- Run this on your existing database

ALTER TABLE license_purchases
ADD COLUMN contact_person VARCHAR(255) AFTER vendor,
ADD COLUMN email VARCHAR(255) AFTER contact_person,
ADD COLUMN phone VARCHAR(50) AFTER email,
ADD COLUMN company VARCHAR(255) AFTER phone,
ADD COLUMN address TEXT AFTER company,
ADD COLUMN gst_treatment VARCHAR(100) AFTER address,
ADD COLUMN source_of_supply VARCHAR(100) AFTER gst_treatment,
ADD COLUMN pan CHAR(10) AFTER source_of_supply;
