<?php
/**
 * Web Endpoint for Email Notifications
 * Use this as an alternative to cron jobs - can be called via wget/curl
 * Access: https://yourdomain.com/php/backend/email_system/web_endpoint.php
 */

// Security: Simple token-based authentication (change this token!)
$SECURITY_TOKEN = 'cybaem_2025_secure_token';

// Check for security token
$providedToken = $_GET['token'] ?? $_POST['token'] ?? '';
if ($providedToken !== $SECURITY_TOKEN) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized access. Invalid token.',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Set headers for JSON response
header('Content-Type: application/json');

// Set timezone
date_default_timezone_set('Asia/Kolkata');

try {
    // Include the notification service
    require_once __DIR__ . '/EmailNotificationService.php';
    
    $startTime = microtime(true);
    
    // Initialize and run email service
    $emailService = new EmailNotificationService();
    $results = $emailService->sendDailyNotifications();
    
    $executionTime = round((microtime(true) - $startTime), 2);
    $totalSent = $results['30_days'] + $results['15_days'] + $results['7_days'] + $results['1_day'] + $results['expired'];
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Daily notifications processed successfully',
        'timestamp' => date('Y-m-d H:i:s'),
        'execution_time' => $executionTime . ' seconds',
        'summary' => [
            'total_sent' => $totalSent,
            'notifications' => [
                '30_days_before' => $results['30_days'],
                '15_days_before' => $results['15_days'],
                '7_days_before' => $results['7_days'],
                '1_day_before' => $results['1_day'],
                'expired_today' => $results['expired']
            ],
            'error_count' => count($results['errors']),
            'errors' => $results['errors']
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'execution_time' => round((microtime(true) - $startTime), 2) . ' seconds'
    ], JSON_PRETTY_PRINT);
}
?>