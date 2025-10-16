<?php
/**
 * Email System Configuration
 * Update these settings according to your email provider
 */

return [
    // SMTP Configuration
    'smtp' => [
        'host' => 'smtp.gmail.com',           // Gmail SMTP server
        'port' => 587,                        // TLS port (use 465 for SSL)
        'username' => 'your-email@gmail.com', // Your Gmail address
        'password' => 'your-app-password',    // Gmail App Password (not regular password)
        'encryption' => 'tls',                // 'tls' or 'ssl'
    ],
    
    // Alternative SMTP providers (uncomment to use)
    /*
    // For cPanel/Shared hosting SMTP
    'smtp' => [
        'host' => 'localhost',                // or mail.yourdomain.com
        'port' => 587,
        'username' => 'noreply@yourdomain.com',
        'password' => 'your-email-password',
        'encryption' => 'tls',
    ],
    
    // For Outlook/Hotmail
    'smtp' => [
        'host' => 'smtp-mail.outlook.com',
        'port' => 587,
        'username' => 'your-email@outlook.com',
        'password' => 'your-password',
        'encryption' => 'tls',
    ],
    
    // For Yahoo Mail
    'smtp' => [
        'host' => 'smtp.mail.yahoo.com',
        'port' => 587,
        'username' => 'your-email@yahoo.com',
        'password' => 'your-app-password',
        'encryption' => 'tls',
    ],
    */
    
    // Sender Information
    'from' => [
        'email' => 'noreply@cybaemtech.com',
        'name' => 'Cybaem Tech License Management'
    ],
    
    // Email Templates Configuration
    'templates' => [
        'company_name' => 'Cybaem Tech',
        'website' => 'https://cybaemtech.com',
        'support_email' => 'rohan.bhosale@cybaemtech.com',
        'accounts_email' => 'accounts@cybaemtech.com',
        'logo_url' => 'https://cybaemtech.com/logo.png', // Optional company logo
    ],
    
    // Notification Settings
    'notifications' => [
        'timezone' => 'Asia/Kolkata',         // Server timezone
        'daily_time' => '11:00',              // Time to send daily notifications (24h format)
        'max_retries' => 3,                   // Max retry attempts for failed emails
        'batch_size' => 50,                   // Max emails to send per batch
    ],
    
    // Logging Configuration
    'logging' => [
        'enabled' => true,
        'level' => 'info',                    // 'debug', 'info', 'warning', 'error'
        'log_file' => __DIR__ . '/logs/email_system.log',
    ]
];
?>