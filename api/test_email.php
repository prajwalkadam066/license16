<?php
/**
 * Test script for email notifications
 * This script tests the email notification system without database logging
 */

require_once 'config/cors.php';
require_once 'config/database.php';

// Test email sending function
function testEmailNotification() {
    // Test email content without emojis
    $testSubject = "Test License Expiration Alert - No Emojis";
    $testMessage = "
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>LICENSE ALERT TEST</h1>
            </div>
            <div class='content'>
                <p>This is a test email to verify the notification system is working properly.</p>
                <p>Test sent at: " . date('Y-m-d H:i:s') . "</p>
                <p>No emojis or special UTF-8 characters are included in this test.</p>
            </div>
        </div>
    </body>
    </html>";

    // Email headers
    $headers = "From: License Management System <noreply@cybaemtech.com>\r\n";
    $headers .= "Reply-To: accounts.ho@cybaemtech.com\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    // Test email address (replace with your test email)
    $testEmail = "accounts.ho@cybaemtech.com";

    // Send test email
    $result = mail($testEmail, $testSubject, $testMessage, $headers);

    return [
        'success' => $result,
        'message' => $result ? 'Test email sent successfully!' : 'Failed to send test email',
        'email' => $testEmail,
        'timestamp' => date('Y-m-d H:i:s')
    ];
}

// Set content type
header('Content-Type: application/json; charset=UTF-8');

try {
    $result = testEmailNotification();
    echo json_encode($result, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>