<?php
/**
 * Email System Test Script
 * Use this to test your email configuration before setting up cron jobs
 */

require_once __DIR__ . '/EmailNotificationService.php';

// Test configuration
$testLicense = [
    'id' => 'test-license-123',
    'user_id' => 'test-user-456',
    'tool_name' => 'Adobe Photoshop CC 2024',
    'vendor' => 'Adobe Systems',
    'cost_per_user' => 599.00,
    'quantity' => 5,
    'total_cost' => 2995.00,
    'currency_code' => 'USD',
    'purchase_date' => '2024-01-15',
    'expiration_date' => date('Y-m-d', strtotime('+7 days')), // Expires in 7 days
    'serial_no' => 'TEST-SERIAL-7890',
    'client_name' => 'Test Client Company',
    'client_email' => 'test@example.com', // Replace with your test email
    'user_email' => 'user@example.com'
];

$testNotification = [
    'type' => '7_days',
    'days' => 7,
    'subject_template' => '7 Days Remaining - License Expiring Soon'
];

echo "Testing Email System...\n";
echo "========================\n";

try {
    // Create email service instance
    $emailService = new EmailNotificationService();
    
    // Test email generation
    echo "1. Testing email content generation...\n";
    
    // Use reflection to access private methods for testing
    $reflection = new ReflectionClass($emailService);
    
    $generateSubjectMethod = $reflection->getMethod('generateSubject');
    $generateSubjectMethod->setAccessible(true);
    $subject = $generateSubjectMethod->invoke($emailService, $testLicense, $testNotification);
    
    $generateHtmlBodyMethod = $reflection->getMethod('generateHtmlBody');
    $generateHtmlBodyMethod->setAccessible(true);
    $htmlBody = $generateHtmlBodyMethod->invoke($emailService, $testLicense, $testNotification);
    
    $generateTextBodyMethod = $reflection->getMethod('generateTextBody');
    $generateTextBodyMethod->setAccessible(true);
    $textBody = $generateTextBodyMethod->invoke($emailService, $testLicense, $testNotification);
    
    echo "✓ Subject: {$subject}\n";
    echo "✓ HTML body generated (" . strlen($htmlBody) . " characters)\n";
    echo "✓ Text body generated (" . strlen($textBody) . " characters)\n";
    
    // Test email sending (only if test email is provided)
    if ($testLicense['client_email'] !== 'test@example.com') {
        echo "\n2. Testing email sending...\n";
        
        $sendNotificationMethod = $reflection->getMethod('sendNotificationEmail');
        $sendNotificationMethod->setAccessible(true);
        $result = $sendNotificationMethod->invoke($emailService, $testLicense, $testNotification);
        
        if ($result) {
            echo "✅ Test email sent successfully!\n";
        } else {
            echo "❌ Failed to send test email. Check your SMTP configuration.\n";
        }
    } else {
        echo "\n2. Skipping email sending test (update client_email in this script)\n";
        echo "   Replace 'test@example.com' with a real email address to test sending.\n";
    }
    
    // Save sample email to file for preview
    echo "\n3. Saving sample email to file...\n";
    $sampleFile = __DIR__ . '/sample_email.html';
    file_put_contents($sampleFile, $htmlBody);
    echo "✓ Sample email saved to: {$sampleFile}\n";
    
    echo "\n✅ Email system test completed successfully!\n";
    echo "\nNext steps:\n";
    echo "1. Update SMTP configuration in EmailNotificationService.php\n";
    echo "2. Update client_email in this test script and run again to test sending\n";
    echo "3. Set up cron job for daily_notifications.php\n";
    
} catch (Exception $e) {
    echo "\n❌ Email system test failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    
    echo "\nTroubleshooting:\n";
    echo "1. Ensure PHPMailer is installed (run install_phpmailer.php)\n";
    echo "2. Check SMTP configuration in EmailNotificationService.php\n";
    echo "3. Verify database connection settings\n";
    echo "4. Check PHP error log for detailed error messages\n";
}

echo "\n";
?>