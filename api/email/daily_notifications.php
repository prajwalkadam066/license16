<?php
/**
 * Daily Email Notifications Script
 * Run this script daily at 11:00 AM via cron job
 */

// Set timezone (adjust as needed)
date_default_timezone_set('Asia/Kolkata');

// Error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php_errors.log');

// Include the notification service
require_once __DIR__ . '/EmailNotificationService.php';

// Create log entry for script start
$startTime = microtime(true);
$logMessage = "===== Daily Email Notifications Started: " . date('Y-m-d H:i:s') . " =====\n";
error_log($logMessage);

try {
    // Initialize the email service
    $emailService = new EmailNotificationService();
    
    // Send daily notifications
    $results = $emailService->sendDailyNotifications();
    
    // Calculate execution time
    $executionTime = round((microtime(true) - $startTime), 2);
    
    // Create summary report
    $totalSent = $results['30_days'] + $results['15_days'] + $results['7_days'] + $results['1_day'] + $results['expired'];
    $errorCount = count($results['errors']);
    
    $summary = "
===== Daily Email Notifications Summary =====
Date: " . date('Y-m-d H:i:s') . "
Execution Time: {$executionTime} seconds

Notifications Sent:
- 30 Days Before: {$results['30_days']}
- 15 Days Before: {$results['15_days']}
- 7 Days Before: {$results['7_days']}
- 1 Day Before: {$results['1_day']}
- Expired Today: {$results['expired']}

Total Sent: {$totalSent}
Errors: {$errorCount}
";
    
    if ($errorCount > 0) {
        $summary .= "\nError Details:\n";
        foreach ($results['errors'] as $error) {
            $summary .= "- {$error}\n";
        }
    }
    
    $summary .= "===== End Summary =====\n";
    
    // Log the summary
    error_log($summary);
    echo $summary;
    
    // Exit with success code
    exit(0);
    
} catch (Exception $e) {
    $executionTime = round((microtime(true) - $startTime), 2);
    $errorMessage = "
===== CRITICAL ERROR in Daily Email Notifications =====
Date: " . date('Y-m-d H:i:s') . "
Execution Time: {$executionTime} seconds
Error: " . $e->getMessage() . "
Stack Trace: " . $e->getTraceAsString() . "
===== End Error Report =====
";
    
    error_log($errorMessage);
    echo $errorMessage;
    
    // Exit with error code
    exit(1);
}
?>