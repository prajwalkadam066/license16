<?php
/**
 * SMTP Email Test Endpoint
 * Tests the SMTP email configuration by sending a test email
 */

require_once __DIR__ . '/email/SmtpMailer.php';

header('Content-Type: application/json');

try {
    // Get mailer instance
    $mailer = SmtpMailer::getInstance();
    
    // Test email content
    $testSubject = "Test Email - SMTP Configuration";
    $testHtmlBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4; }
            .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='card'>
                <div class='header'>
                    <h1 style='margin: 0;'>✅ SMTP Test Successful</h1>
                </div>
                <div style='padding: 20px;'>
                    <div class='success'>
                        <h3 style='margin-top: 0;'>Email Configuration Working!</h3>
                        <p>Your SMTP email system is configured correctly and working as expected.</p>
                    </div>
                    
                    <h3>Configuration Details:</h3>
                    <ul>
                        <li><strong>SMTP Host:</strong> " . (getenv('SMTP_HOST') ?: 'Not configured') . "</li>
                        <li><strong>SMTP Port:</strong> " . (getenv('SMTP_PORT') ?: 'Not configured') . "</li>
                        <li><strong>From Email:</strong> " . (getenv('SMTP_FROM_EMAIL') ?: 'Not configured') . "</li>
                        <li><strong>From Name:</strong> " . (getenv('SMTP_FROM_NAME') ?: 'Not configured') . "</li>
                        <li><strong>Test Time:</strong> " . date('Y-m-d H:i:s') . "</li>
                    </ul>
                    
                    <p style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;'>
                        This is an automated test email from your License Management System.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>";
    
    $testTextBody = "SMTP TEST EMAIL - Configuration Working!\n\nYour SMTP email system is configured correctly.\n\nSMTP Host: " . (getenv('SMTP_HOST') ?: 'Not configured') . "\nSMTP Port: " . (getenv('SMTP_PORT') ?: 'Not configured') . "\nFrom Email: " . (getenv('SMTP_FROM_EMAIL') ?: 'Not configured') . "\nTest Time: " . date('Y-m-d H:i:s');
    
    // Get admin email from environment or use default
    $adminEmail = getenv('ADMIN_EMAIL') ?: 'accounts.ho@cybaemtech.com';
    
    // Send test email
    $sent = $mailer->send($adminEmail, $testSubject, $testHtmlBody, $testTextBody, 'Admin');
    
    if ($sent) {
        echo json_encode([
            'success' => true,
            'message' => 'Test email sent successfully!',
            'recipient' => $adminEmail,
            'smtp_host' => getenv('SMTP_HOST') ?: 'Not configured',
            'smtp_port' => getenv('SMTP_PORT') ?: 'Not configured',
            'from_email' => getenv('SMTP_FROM_EMAIL') ?: 'Not configured',
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to send test email. Check SMTP configuration and credentials.',
            'smtp_host' => getenv('SMTP_HOST') ?: 'Not configured',
            'smtp_port' => getenv('SMTP_PORT') ?: 'Not configured'
        ], JSON_PRETTY_PRINT);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'SMTP configuration error. Please check your environment variables.',
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
